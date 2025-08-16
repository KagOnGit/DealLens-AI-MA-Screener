from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, extract
from datetime import datetime, timedelta

from ..core.database import get_db
from ..core.deps import get_optional_user
from ..models import Deal, Company, DealStatus, AIInsight, User
from ..deps import cache_get, cache_set

router = APIRouter()


@router.get("/overview")
async def get_analytics_overview(
    period: str = Query("12M", description="Period: 1M, 3M, 6M, 12M, 5Y"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get comprehensive M&A analytics overview."""
    
    # Check cache first
    cache_key = f"analytics_overview:{period}"
    cached_data = await cache_get(cache_key)
    if cached_data:
        return cached_data
    
    # Parse period
    period_days = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "12M": 365,
        "5Y": 1825
    }.get(period, 365)
    
    cutoff_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Base query for the period
    base_query = db.query(Deal).filter(Deal.announced_at >= cutoff_date)
    
    # Total metrics
    total_deals = base_query.count()
    total_value_result = base_query.filter(Deal.value_usd.isnot(None)).with_entities(
        func.sum(Deal.value_usd)
    ).scalar()
    total_value = float(total_value_result) if total_value_result else 0
    
    avg_deal_size = total_value / total_deals if total_deals > 0 else 0
    
    # Success rate calculation
    completed_deals = base_query.filter(Deal.status == DealStatus.COMPLETED).count()
    failed_deals = base_query.filter(Deal.status == DealStatus.TERMINATED).count()
    total_closed_deals = completed_deals + failed_deals
    success_rate = (completed_deals / total_closed_deals * 100) if total_closed_deals > 0 else 0
    
    # Sector trends (top 10 by deal count)
    sector_trends = db.query(
        Company.sector,
        func.count(Deal.id).label('deals'),
        func.sum(Deal.value_usd).label('value_usd')
    ).join(
        Deal, Company.id == Deal.acquirer_id
    ).filter(
        Deal.announced_at >= cutoff_date,
        Company.sector.isnot(None)
    ).group_by(
        Company.sector
    ).order_by(
        func.count(Deal.id).desc()
    ).limit(10).all()
    
    formatted_sector_trends = [
        {
            "sector": sector,
            "deals": deals,
            "value_usd": float(value) if value else 0
        }
        for sector, deals, value in sector_trends
    ]
    
    # Top acquirers
    top_acquirers = db.query(
        Company.ticker,
        Company.name,
        func.count(Deal.id).label('deals'),
        func.sum(Deal.value_usd).label('value_usd')
    ).join(
        Deal, Company.id == Deal.acquirer_id
    ).filter(
        Deal.announced_at >= cutoff_date
    ).group_by(
        Company.id, Company.ticker, Company.name
    ).order_by(
        func.count(Deal.id).desc()
    ).limit(10).all()
    
    formatted_top_acquirers = [
        {
            "ticker": ticker,
            "name": name,
            "deals": deals,
            "value_usd": float(value) if value else 0
        }
        for ticker, name, deals, value in top_acquirers
    ]
    
    # Monthly volume (for chart data)
    monthly_volume = db.query(
        extract('year', Deal.announced_at).label('year'),
        extract('month', Deal.announced_at).label('month'),
        func.count(Deal.id).label('deals'),
        func.sum(Deal.value_usd).label('value_usd')
    ).filter(
        Deal.announced_at >= cutoff_date
    ).group_by(
        extract('year', Deal.announced_at),
        extract('month', Deal.announced_at)
    ).order_by('year', 'month').all()
    
    formatted_monthly_volume = [
        {
            "month": f"{int(year)}-{int(month):02d}",
            "deals": deals,
            "value_usd": float(value) if value else 0
        }
        for year, month, deals, value in monthly_volume
    ]
    
    # Deal size distribution
    deal_sizes = base_query.filter(Deal.value_usd.isnot(None)).with_entities(Deal.value_usd).all()
    
    size_distribution = {
        "under_1b": 0,
        "1b_to_5b": 0,
        "5b_to_10b": 0,
        "over_10b": 0
    }
    
    for (value,) in deal_sizes:
        value_float = float(value)
        if value_float < 1e9:
            size_distribution["under_1b"] += 1
        elif value_float < 5e9:
            size_distribution["1b_to_5b"] += 1
        elif value_float < 10e9:
            size_distribution["5b_to_10b"] += 1
        else:
            size_distribution["over_10b"] += 1
    
    # Payment type distribution
    payment_types = db.query(
        Deal.payment_type,
        func.count(Deal.id).label('count')
    ).filter(
        Deal.announced_at >= cutoff_date,
        Deal.payment_type.isnot(None)
    ).group_by(Deal.payment_type).all()
    
    payment_distribution = {payment_type.value: count for payment_type, count in payment_types}
    
    response_data = {
        "period": period,
        "total_deals": total_deals,
        "total_value": total_value,
        "avg_deal_size": avg_deal_size,
        "success_rate": round(success_rate, 2),
        "sector_trends": formatted_sector_trends,
        "top_acquirers": formatted_top_acquirers,
        "monthly_volume": formatted_monthly_volume,
        "size_distribution": size_distribution,
        "payment_distribution": payment_distribution,
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Cache for 10 minutes
    await cache_set(cache_key, response_data, ttl=600)
    
    return response_data


@router.get("/heatmap")
async def get_analytics_heatmap(
    period: str = Query("12M", description="Period: 1M, 3M, 6M, 12M, 5Y"),
    metric: str = Query("deals", description="Metric: deals, value"),
    db: Session = Depends(get_db)
):
    """Get sector vs deal activity heatmap data."""
    
    cache_key = f"analytics_heatmap:{period}:{metric}"
    cached_data = await cache_get(cache_key)
    if cached_data:
        return cached_data
    
    # Parse period
    period_days = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "12M": 365,
        "5Y": 1825
    }.get(period, 365)
    
    cutoff_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Get sector combinations (acquirer sector vs target sector)
    if metric == "value":
        heatmap_data = db.query(
            Company.sector.label('acquirer_sector'),
            func.count(Deal.id).label('deal_count'),
            func.sum(Deal.value_usd).label('total_value')
        ).select_from(Deal).join(
            Company, Company.id == Deal.acquirer_id
        ).filter(
            Deal.announced_at >= cutoff_date,
            Company.sector.isnot(None)
        ).group_by(
            Company.sector
        ).all()
    else:
        heatmap_data = db.query(
            Company.sector.label('acquirer_sector'),
            func.count(Deal.id).label('deal_count')
        ).select_from(Deal).join(
            Company, Company.id == Deal.acquirer_id
        ).filter(
            Deal.announced_at >= cutoff_date,
            Company.sector.isnot(None)
        ).group_by(
            Company.sector
        ).all()
    
    # Format for heatmap visualization
    heatmap_matrix = []
    for row in heatmap_data:
        if metric == "value":
            heatmap_matrix.append({
                "sector": row.acquirer_sector,
                "deals": row.deal_count,
                "value": float(row.total_value) if row.total_value else 0
            })
        else:
            heatmap_matrix.append({
                "sector": row.acquirer_sector,
                "deals": row.deal_count
            })
    
    response_data = {
        "period": period,
        "metric": metric,
        "heatmap_data": heatmap_matrix,
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Cache for 15 minutes
    await cache_set(cache_key, response_data, ttl=900)
    
    return response_data


@router.get("/trends")
async def get_market_trends(
    period: str = Query("12M", description="Period for trend analysis"),
    db: Session = Depends(get_db)
):
    """Get market trends and AI commentary."""
    
    cache_key = f"analytics_trends:{period}"
    cached_data = await cache_get(cache_key)
    if cached_data:
        return cached_data
    
    # Get basic analytics data
    overview_data = await get_analytics_overview(period, db)
    
    # Get AI insights for analytics
    ai_insight = db.query(AIInsight).filter(
        and_(
            AIInsight.scope == "analytics",
            AIInsight.ref_key == period
        )
    ).order_by(AIInsight.updated_at.desc()).first()
    
    # Calculate trend indicators
    current_period_days = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "12M": 365,
        "5Y": 1825
    }.get(period, 365)
    
    # Compare with previous period
    current_cutoff = datetime.utcnow() - timedelta(days=current_period_days)
    previous_cutoff = datetime.utcnow() - timedelta(days=current_period_days * 2)
    
    # Current period metrics
    current_deals = db.query(Deal).filter(Deal.announced_at >= current_cutoff).count()
    current_value = db.query(Deal).filter(
        and_(Deal.announced_at >= current_cutoff, Deal.value_usd.isnot(None))
    ).with_entities(func.sum(Deal.value_usd)).scalar() or 0
    
    # Previous period metrics
    previous_deals = db.query(Deal).filter(
        and_(Deal.announced_at >= previous_cutoff, Deal.announced_at < current_cutoff)
    ).count()
    previous_value = db.query(Deal).filter(
        and_(
            Deal.announced_at >= previous_cutoff,
            Deal.announced_at < current_cutoff,
            Deal.value_usd.isnot(None)
        )
    ).with_entities(func.sum(Deal.value_usd)).scalar() or 0
    
    # Calculate trends
    deals_trend = ((current_deals - previous_deals) / previous_deals * 100) if previous_deals > 0 else 0
    value_trend = ((float(current_value) - float(previous_value)) / float(previous_value) * 100) if previous_value > 0 else 0
    
    # Hot sectors (fastest growing)
    hot_sectors = []
    for sector_data in overview_data["sector_trends"][:5]:
        sector = sector_data["sector"]
        # Get previous period data for this sector
        prev_sector_deals = db.query(Deal).join(Company, Company.id == Deal.acquirer_id).filter(
            and_(
                Deal.announced_at >= previous_cutoff,
                Deal.announced_at < current_cutoff,
                Company.sector == sector
            )
        ).count()
        
        current_sector_deals = sector_data["deals"]
        growth = ((current_sector_deals - prev_sector_deals) / prev_sector_deals * 100) if prev_sector_deals > 0 else 100
        
        hot_sectors.append({
            "sector": sector,
            "current_deals": current_sector_deals,
            "growth_pct": round(growth, 1)
        })
    
    # Sort by growth
    hot_sectors.sort(key=lambda x: x["growth_pct"], reverse=True)
    
    response_data = {
        "period": period,
        "trends": {
            "deals_trend_pct": round(deals_trend, 1),
            "value_trend_pct": round(value_trend, 1),
            "trend_direction": "up" if deals_trend > 0 else "down" if deals_trend < 0 else "flat"
        },
        "hot_sectors": hot_sectors[:5],
        "ai_commentary": {
            "summary": ai_insight.text if ai_insight else None,
            "confidence": float(ai_insight.confidence) if ai_insight and ai_insight.confidence else None,
            "updated_at": ai_insight.updated_at.isoformat() if ai_insight else None
        },
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Cache for 30 minutes
    await cache_set(cache_key, response_data, ttl=1800)
    
    return response_data


@router.get("/export")
async def export_analytics_data(
    period: str = Query("12M", description="Period for export"),
    format: str = Query("json", description="Export format: json, csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    """Export analytics data in various formats."""
    
    # Get comprehensive data
    overview_data = await get_analytics_overview(period, db)
    heatmap_data = await get_analytics_heatmap(period, "deals", db)
    trends_data = await get_market_trends(period, db)
    
    export_data = {
        "overview": overview_data,
        "heatmap": heatmap_data,
        "trends": trends_data,
        "exported_at": datetime.utcnow().isoformat(),
        "exported_by": current_user.email if current_user else "anonymous"
    }
    
    if format.lower() == "csv":
        # For CSV export, we'd need to flatten the data structure
        # This is a simplified version - in production, you'd want proper CSV formatting
        import io
        import csv
        
        output = io.StringIO()
        
        # Write sector trends as CSV
        writer = csv.writer(output)
        writer.writerow(["Sector", "Deal Count", "Total Value USD"])
        
        for sector_data in overview_data["sector_trends"]:
            writer.writerow([
                sector_data["sector"],
                sector_data["deals"],
                sector_data["value_usd"]
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        return {
            "format": "csv",
            "content": csv_content,
            "filename": f"deallens_analytics_{period}_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    
    return export_data


@router.get("/sectors/{sector}")
async def get_sector_analysis(
    sector: str,
    period: str = Query("12M", description="Period for analysis"),
    db: Session = Depends(get_db)
):
    """Get detailed analysis for a specific sector."""
    
    cache_key = f"sector_analysis:{sector}:{period}"
    cached_data = await cache_get(cache_key)
    if cached_data:
        return cached_data
    
    period_days = {
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "12M": 365,
        "5Y": 1825
    }.get(period, 365)
    
    cutoff_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Sector-specific deals
    sector_deals = db.query(Deal).join(
        Company, Company.id == Deal.acquirer_id
    ).filter(
        and_(
            Deal.announced_at >= cutoff_date,
            Company.sector.ilike(f"%{sector}%")
        )
    ).all()
    
    if not sector_deals:
        raise HTTPException(status_code=404, detail=f"No deals found for sector: {sector}")
    
    # Calculate sector metrics
    total_deals = len(sector_deals)
    total_value = sum(float(deal.value_usd) for deal in sector_deals if deal.value_usd)
    avg_deal_size = total_value / total_deals if total_deals > 0 else 0
    
    # Top companies in sector
    top_acquirers = db.query(
        Company.ticker,
        Company.name,
        func.count(Deal.id).label('deals')
    ).join(Deal, Company.id == Deal.acquirer_id).filter(
        and_(
            Deal.announced_at >= cutoff_date,
            Company.sector.ilike(f"%{sector}%")
        )
    ).group_by(Company.id, Company.ticker, Company.name).order_by(
        func.count(Deal.id).desc()
    ).limit(5).all()
    
    formatted_top_acquirers = [
        {"ticker": ticker, "name": name, "deals": deals}
        for ticker, name, deals in top_acquirers
    ]
    
    response_data = {
        "sector": sector,
        "period": period,
        "total_deals": total_deals,
        "total_value": total_value,
        "avg_deal_size": avg_deal_size,
        "top_acquirers": formatted_top_acquirers,
        "recent_deals": [
            {
                "id": deal.id,
                "title": deal.title or f"{deal.acquirer.name} → {deal.target.name}",
                "value_usd": float(deal.value_usd) if deal.value_usd else None,
                "announced_at": deal.announced_at.isoformat() if deal.announced_at else None,
                "status": deal.status.value
            }
            for deal in sorted(sector_deals, key=lambda x: x.announced_at or datetime.min, reverse=True)[:10]
        ],
        "generated_at": datetime.utcnow().isoformat()
    }
    
    # Cache for 20 minutes
    await cache_set(cache_key, response_data, ttl=1200)
    
    return response_data
