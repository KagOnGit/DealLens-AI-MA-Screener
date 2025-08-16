from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_

from ..core.database import get_db
from ..core.deps import get_current_user, get_optional_user
from ..models import Deal, DealMilestone, Company, NewsItem, AIInsight, DealStatus, User
from ..deps import PaginationParams, FilterParams, paginate_query, apply_sorting, cache_get, cache_set, validate_date_range, generate_id

router = APIRouter()


class DealsFilterParams(FilterParams):
    """Deal-specific filter parameters."""
    def __init__(
        self,
        sector: Optional[str] = Query(None, description="Filter by sector"),
        status: Optional[str] = Query(None, description="Filter by deal status"),
        acquirer: Optional[str] = Query(None, description="Filter by acquirer name/ticker"),
        target: Optional[str] = Query(None, description="Filter by target name/ticker"),
        min_value: Optional[float] = Query(None, description="Minimum deal value"),
        max_value: Optional[float] = Query(None, description="Maximum deal value"),
        start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
        end_date: Optional[str] = Query(None, description="End date (ISO format)"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.sector = sector
        self.status = status
        self.acquirer = acquirer
        self.target = target
        self.min_value = min_value
        self.max_value = max_value
        self.start_date = start_date
        self.end_date = end_date


@router.get("", response_model=Dict[str, Any])
async def list_deals(
    db: Session = Depends(get_db),
    pagination: PaginationParams = Depends(),
    filters: DealsFilterParams = Depends(),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List deals with filtering and pagination."""
    
    # Base query with eager loading
    query = db.query(Deal).options(
        joinedload(Deal.acquirer),
        joinedload(Deal.target)
    )
    
    # Apply filters
    if filters.status:
        try:
            status_enum = DealStatus(filters.status)
            query = query.filter(Deal.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {filters.status}")
    
    if filters.sector:
        query = query.join(Deal.acquirer).filter(
            or_(
                Company.sector.ilike(f"%{filters.sector}%"),
                # Also check target sector
                db.query(Company).filter(Company.id == Deal.target_id, 
                                        Company.sector.ilike(f"%{filters.sector}%")).exists()
            )
        )
    
    if filters.acquirer:
        query = query.join(Deal.acquirer).filter(
            or_(
                Company.name.ilike(f"%{filters.acquirer}%"),
                Company.ticker.ilike(f"%{filters.acquirer}%")
            )
        )
    
    if filters.target:
        query = query.join(Deal.target).filter(
            or_(
                Company.name.ilike(f"%{filters.target}%"),
                Company.ticker.ilike(f"%{filters.target}%")
            )
        )
    
    if filters.min_value:
        query = query.filter(Deal.value_usd >= filters.min_value)
    
    if filters.max_value:
        query = query.filter(Deal.value_usd <= filters.max_value)
    
    # Date range filter
    if filters.start_date or filters.end_date:
        start_date, end_date = validate_date_range(filters.start_date, filters.end_date)
        
        if start_date:
            query = query.filter(Deal.announced_at >= start_date)
        if end_date:
            query = query.filter(Deal.announced_at <= end_date)
    
    # Apply search (on deal title and company names)
    if filters.query:
        search_term = f"%{filters.query}%"
        query = query.filter(
            or_(
                Deal.title.ilike(search_term),
                Deal.description.ilike(search_term),
                Deal.acquirer.has(Company.name.ilike(search_term)),
                Deal.target.has(Company.name.ilike(search_term))
            )
        )
    
    # Apply sorting
    query = apply_sorting(query, Deal, filters.sort_by or "announced_at", filters.sort_order)
    
    # Paginate results
    result = paginate_query(query, pagination)
    
    # Format response
    formatted_deals = []
    for deal in result["items"]:
        deal_data = {
            "id": deal.id,
            "title": deal.title or f"{deal.acquirer.name} → {deal.target.name}",
            "acquirer": {
                "id": deal.acquirer.id,
                "ticker": deal.acquirer.ticker,
                "name": deal.acquirer.name,
                "sector": deal.acquirer.sector
            },
            "target": {
                "id": deal.target.id,
                "ticker": deal.target.ticker,
                "name": deal.target.name,
                "sector": deal.target.sector
            },
            "value_usd": float(deal.value_usd) if deal.value_usd else None,
            "status": deal.status.value,
            "announced_at": deal.announced_at.isoformat() if deal.announced_at else None,
            "expected_close_at": deal.expected_close_at.isoformat() if deal.expected_close_at else None,
            "premium_pct": float(deal.premium_pct) if deal.premium_pct else None,
            "payment_type": deal.payment_type.value if deal.payment_type else None,
        }
        formatted_deals.append(deal_data)
    
    result["items"] = formatted_deals
    return result


@router.get("/{deal_id}", response_model=Dict[str, Any])
async def get_deal_detail(
    deal_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get detailed deal information with milestones, news, and AI insights."""
    
    # Check cache first
    cache_key = f"deal_detail:{deal_id}"
    cached_data = await cache_get(cache_key)
    
    if cached_data:
        return cached_data
    
    # Find deal with eager loading
    deal = db.query(Deal).options(
        joinedload(Deal.acquirer),
        joinedload(Deal.target),
        joinedload(Deal.milestones),
        joinedload(Deal.news_items)
    ).filter(Deal.id == deal_id).first()
    
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    
    # Get AI insights
    ai_insight = db.query(AIInsight).filter(
        and_(
            AIInsight.scope == "deal",
            AIInsight.ref_key == deal_id
        )
    ).order_by(AIInsight.updated_at.desc()).first()
    
    # Get comparable deals (same sector, announced in last 2 years)
    from datetime import datetime, timedelta
    two_years_ago = datetime.utcnow() - timedelta(days=730)
    
    comparable_deals = db.query(Deal).options(
        joinedload(Deal.acquirer),
        joinedload(Deal.target)
    ).filter(
        and_(
            Deal.id != deal_id,
            Deal.announced_at >= two_years_ago,
            or_(
                Deal.acquirer.has(Company.sector == deal.acquirer.sector),
                Deal.target.has(Company.sector == deal.target.sector)
            ),
            Deal.value_usd.isnot(None)
        )
    ).order_by(Deal.announced_at.desc()).limit(5).all()
    
    # Build response
    response_data = {
        "id": deal.id,
        "title": deal.title or f"{deal.acquirer.name} → {deal.target.name}",
        "acquirer": {
            "id": deal.acquirer.id,
            "ticker": deal.acquirer.ticker,
            "name": deal.acquirer.name,
            "sector": deal.acquirer.sector,
            "market_cap": float(deal.acquirer.market_cap) if deal.acquirer.market_cap else None,
            "description": deal.acquirer.description
        },
        "target": {
            "id": deal.target.id,
            "ticker": deal.target.ticker,
            "name": deal.target.name,
            "sector": deal.target.sector,
            "market_cap": float(deal.target.market_cap) if deal.target.market_cap else None,
            "description": deal.target.description
        },
        "terms": {
            "value_usd": float(deal.value_usd) if deal.value_usd else None,
            "premium_pct": float(deal.premium_pct) if deal.premium_pct else None,
            "payment_type": deal.payment_type.value if deal.payment_type else None,
            "synergies_usd": float(deal.synergies_usd) if deal.synergies_usd else None
        },
        "status": deal.status.value,
        "announced_at": deal.announced_at.isoformat() if deal.announced_at else None,
        "expected_close_at": deal.expected_close_at.isoformat() if deal.expected_close_at else None,
        "closed_at": deal.closed_at.isoformat() if deal.closed_at else None,
        "description": deal.description,
        "strategic_rationale": deal.strategic_rationale,
        "milestones": [
            {
                "id": milestone.id,
                "label": milestone.label,
                "date": milestone.date.isoformat(),
                "description": milestone.description
            }
            for milestone in sorted(deal.milestones, key=lambda x: x.date)
        ],
        "news": [
            {
                "id": item.id,
                "title": item.title,
                "url": item.url,
                "source": item.source,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "summary": item.summary
            }
            for item in sorted(deal.news_items, key=lambda x: x.published_at or datetime.min, reverse=True)
        ],
        "ai": {
            "analyst_memo": ai_insight.text if ai_insight else None,
            "confidence": float(ai_insight.confidence) if ai_insight and ai_insight.confidence else None,
            "updated_at": ai_insight.updated_at.isoformat() if ai_insight else None
        },
        "comparable_deals": [
            {
                "id": comp_deal.id,
                "title": comp_deal.title or f"{comp_deal.acquirer.name} → {comp_deal.target.name}",
                "acquirer_name": comp_deal.acquirer.name,
                "target_name": comp_deal.target.name,
                "value_usd": float(comp_deal.value_usd) if comp_deal.value_usd else None,
                "announced_at": comp_deal.announced_at.isoformat() if comp_deal.announced_at else None,
                "status": comp_deal.status.value
            }
            for comp_deal in comparable_deals
        ]
    }
    
    # Cache the response for 5 minutes
    await cache_set(cache_key, response_data, ttl=300)
    
    return response_data


@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_deals(
    deals_data: List[Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Batch upsert deals (admin/seeding endpoint)."""
    
    # Simple admin check (in production, use proper admin role)
    if not current_user.is_admin and not current_user.email.endswith("@deallens.ai"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    created_count = 0
    updated_count = 0
    
    try:
        for deal_data in deals_data:
            # Find or create deal
            existing_deal = db.query(Deal).filter(Deal.id == deal_data.get("id")).first()
            
            if existing_deal:
                # Update existing deal
                for key, value in deal_data.items():
                    if hasattr(existing_deal, key) and key != "id":
                        setattr(existing_deal, key, value)
                updated_count += 1
            else:
                # Create new deal
                if "id" not in deal_data:
                    deal_data["id"] = generate_id("deal")
                
                new_deal = Deal(**deal_data)
                db.add(new_deal)
                created_count += 1
        
        db.commit()
        
        return {
            "message": f"Successfully processed {len(deals_data)} deals",
            "created": created_count,
            "updated": updated_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Error processing deals: {str(e)}")


# Statistics endpoints for analytics
@router.get("/stats/overview")
async def get_deals_overview(
    db: Session = Depends(get_db),
    period_days: int = Query(365, description="Period in days for statistics")
):
    """Get deals overview statistics."""
    
    from datetime import datetime, timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=period_days)
    
    # Base query for the period
    base_query = db.query(Deal).filter(Deal.announced_at >= cutoff_date)
    
    # Total deals and value
    total_deals = base_query.count()
    total_value = base_query.filter(Deal.value_usd.isnot(None)).with_entities(
        func.sum(Deal.value_usd)
    ).scalar() or 0
    
    # Average deal size
    avg_deal_size = total_value / total_deals if total_deals > 0 else 0
    
    # Deals by status
    status_counts = db.query(
        Deal.status,
        func.count(Deal.id).label('count')
    ).filter(Deal.announced_at >= cutoff_date).group_by(Deal.status).all()
    
    status_distribution = {status.value: count for status, count in status_counts}
    
    # Success rate (completed vs total non-pending)
    completed_deals = base_query.filter(Deal.status == DealStatus.COMPLETED).count()
    non_pending_deals = base_query.filter(Deal.status.in_([
        DealStatus.COMPLETED, DealStatus.TERMINATED
    ])).count()
    success_rate = (completed_deals / non_pending_deals * 100) if non_pending_deals > 0 else 0
    
    # Top sectors by deal count
    sector_stats = db.query(
        Company.sector,
        func.count(Deal.id).label('deal_count'),
        func.sum(Deal.value_usd).label('total_value')
    ).join(Deal.acquirer).filter(
        Deal.announced_at >= cutoff_date,
        Company.sector.isnot(None)
    ).group_by(Company.sector).order_by(
        func.count(Deal.id).desc()
    ).limit(10).all()
    
    sector_trends = [
        {
            "sector": sector,
            "deal_count": count,
            "total_value": float(total_val) if total_val else 0
        }
        for sector, count, total_val in sector_stats
    ]
    
    return {
        "period_days": period_days,
        "total_deals": total_deals,
        "total_value": float(total_value),
        "avg_deal_size": float(avg_deal_size),
        "success_rate": round(success_rate, 2),
        "status_distribution": status_distribution,
        "sector_trends": sector_trends
    }
