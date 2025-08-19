from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timedelta

from ....core.deps import get_db
from ....core.cache import cache_result
from ....models import PrecedentDeal
# from ....schemas.precedents import PrecedentsResponse, PrecedentDetail

router = APIRouter()


@router.get("/", )
@cache_result(expire=600)  # Cache for 10 minutes
async def get_precedents(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    region: Optional[str] = Query(None, description="Filter by region"),
    year: Optional[int] = Query(None, description="Filter by announcement year"),
    status: Optional[str] = Query("announced", description="Deal status: announced, closed, terminated"),
    ev_min: Optional[float] = Query(None, description="Minimum enterprise value in millions"),
    ev_max: Optional[float] = Query(None, description="Maximum enterprise value in millions"),
    page: int = Query(1, description="Page number"),
    limit: int = Query(25, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get precedent transactions with filters and pagination."""
    try:
        # Mock response for now
        mock_deals = []
        for i in range(1, min(limit + 1, 11)):
            mock_deals.append({
                "id": i,
                "acquirer": f"Acquirer Corp {i}",
                "target": f"Target Inc {i}", 
                "sector": sector or "Technology",
                "region": region or "North America",
                "announced_at": (datetime.now() - timedelta(days=i*30)).isoformat(),
                "closed_at": (datetime.now() - timedelta(days=i*30-45)).isoformat() if i % 3 == 0 else None,
                "ev": 1500.0 + (i * 250),
                "revenue": 300.0 + (i * 50),
                "ebitda": 45.0 + (i * 8),
                "ev_to_revenue": 5.0 + (i * 0.3),
                "ev_to_ebitda": 18.5 + (i * 1.2),
                "premium": 25.5 + (i * 2.1),
                "advisors_buy": json.dumps([f"Goldman Sachs", f"Morgan Stanley"]),
                "advisors_sell": json.dumps([f"J.P. Morgan", f"Credit Suisse"]),
                "status": "closed" if i % 3 == 0 else "announced"
            })

        response = {
            "deals": mock_deals,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": 150,
                "pages": 6
            },
            "summary": {
                "median_ev": 2250.0,
                "median_ev_revenue": 6.8,
                "median_ev_ebitda": 22.1,
                "median_premium": 32.4,
                "total_value": 45600.0
            }
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{deal_id}", )
@cache_result(expire=600)  # Cache for 10 minutes
async def get_precedent_detail(
    deal_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific precedent transaction."""
    try:
        # Mock response for now
        mock_detail = {
            "id": deal_id,
            "acquirer": "MegaCorp Industries",
            "target": "InnoTech Solutions",
            "sector": "Technology",
            "region": "North America", 
            "announced_at": "2023-08-15T10:30:00",
            "closed_at": "2023-11-22T16:45:00",
            "ev": 2850.0,
            "revenue": 485.0,
            "ebitda": 72.5,
            "ev_to_revenue": 5.87,
            "ev_to_ebitda": 39.31,
            "premium": 28.4,
            "advisors_buy": ["Goldman Sachs", "Lazard"],
            "advisors_sell": ["J.P. Morgan", "Barclays"],
            "status": "closed",
            "deal_rationale": "Strategic acquisition to expand market presence in cloud infrastructure and AI capabilities.",
            "synergies": {
                "cost_synergies": 125.0,
                "revenue_synergies": 200.0,
                "total_synergies": 325.0
            },
            "financing": {
                "cash": 1850.0,
                "stock": 750.0,
                "debt": 250.0
            }
        }
        return mock_detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
