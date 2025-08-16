from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from ....core.database import get_db
from ....models.company import Company as CompanyModel

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Get dashboard statistics."""
    
    # Get company count
    company_count_result = await db.execute(
        select(func.count(CompanyModel.id)).filter(CompanyModel.is_active == True)
    )
    total_companies = company_count_result.scalar()
    
    # Get total market cap
    market_cap_result = await db.execute(
        select(func.sum(CompanyModel.market_cap)).filter(
            CompanyModel.is_active == True,
            CompanyModel.market_cap.isnot(None)
        )
    )
    total_market_cap = market_cap_result.scalar() or 0
    
    # Get sector breakdown
    sector_result = await db.execute(
        select(
            CompanyModel.sector,
            func.count(CompanyModel.id).label('count'),
            func.sum(CompanyModel.market_cap).label('market_cap')
        )
        .filter(CompanyModel.is_active == True)
        .group_by(CompanyModel.sector)
        .order_by(func.count(CompanyModel.id).desc())
    )
    sector_breakdown = [
        {
            "sector": row.sector or "Unknown",
            "count": row.count,
            "market_cap": float(row.market_cap or 0)
        }
        for row in sector_result.all()
    ]
    
    return {
        "total_companies": total_companies,
        "total_market_cap": float(total_market_cap),
        "sector_breakdown": sector_breakdown,
        "recent_activity": {
            "deals_announced": 12,
            "companies_screened": 1456,
            "alerts_triggered": 3
        },
        "market_overview": {
            "sp500_change": 1.2,
            "nasdaq_change": 1.8,
            "deal_volume_ytd": 245000000000  # $245B
        }
    }


@router.get("/market-data")
async def get_market_data():
    """Get market data for dashboard charts."""
    # Mock data - replace with real market data
    return {
        "indices": [
            {"name": "S&P 500", "value": 4567.89, "change": 1.2, "change_percent": 0.026},
            {"name": "NASDAQ", "value": 14234.56, "change": 1.8, "change_percent": 0.013},
            {"name": "Dow Jones", "value": 35678.90, "change": 0.8, "change_percent": 0.022},
        ],
        "sector_performance": [
            {"sector": "Technology", "change_percent": 2.1, "volume": 1250000000},
            {"sector": "Healthcare", "change_percent": 1.3, "volume": 890000000},
            {"sector": "Financial", "change_percent": -0.5, "volume": 1100000000},
            {"sector": "Energy", "change_percent": 3.2, "volume": 750000000},
        ],
        "deal_activity": {
            "daily_volume": [
                {"date": "2024-01-10", "volume": 2.5, "count": 3},
                {"date": "2024-01-11", "volume": 1.8, "count": 2},
                {"date": "2024-01-12", "volume": 4.2, "count": 5},
                {"date": "2024-01-13", "volume": 0.9, "count": 1},
                {"date": "2024-01-14", "volume": 3.1, "count": 4},
                {"date": "2024-01-15", "volume": 5.7, "count": 6},
                {"date": "2024-01-16", "volume": 2.3, "count": 2},
            ]
        }
    }


@router.get("/alerts")
async def get_alerts():
    """Get recent alerts."""
    return {
        "alerts": [
            {
                "id": "1",
                "type": "deal_announced",
                "title": "Major Tech Acquisition Announced",
                "message": "TechGiant Inc. announced acquisition of AI Startup for $2.5B",
                "timestamp": "2024-01-16T10:30:00Z",
                "severity": "high"
            },
            {
                "id": "2",
                "type": "price_movement",
                "title": "Unusual Price Activity",
                "message": "ACME Corp (ACME) up 15% on acquisition rumors",
                "timestamp": "2024-01-16T09:15:00Z",
                "severity": "medium"
            },
            {
                "id": "3",
                "type": "financial_metric",
                "title": "Earnings Beat",
                "message": "MegaCorp reported Q4 earnings 20% above expectations",
                "timestamp": "2024-01-15T16:00:00Z", 
                "severity": "low"
            }
        ]
    }
