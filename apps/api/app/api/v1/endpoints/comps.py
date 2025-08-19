from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime, timedelta

from ....core.deps import get_db
from ....core.cache import cache_result
from ....models import Company, CompsPeer
# # from ....schemas.comps import CompsResponse, CompsDetail, CompsPeerData

router = APIRouter()


@router.get("/")
@cache_result(expire=600)  # Cache for 10 minutes
async def get_comps(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    region: Optional[str] = Query(None, description="Filter by region"),
    size_min: Optional[float] = Query(None, description="Minimum market cap in billions"),
    size_max: Optional[float] = Query(None, description="Maximum market cap in billions"),
    ticker: Optional[str] = Query(None, description="Base company ticker"),
    peer_set: Optional[str] = Query(None, description="Predefined peer set"),
    db: Session = Depends(get_db)
):
    """Get comparable companies analysis with filters."""
    try:
        # Mock response for now - replace with actual logic
        mock_data = {
            "summary": {
                "count": 15,
                "sector": sector or "Technology",
                "avg_market_cap": 125.8,
                "median_pe": 24.5,
                "median_ev_ebitda": 18.2
            },
            "peers": [
                {
                    "ticker": "AAPL",
                    "name": "Apple Inc.",
                    "market_cap": 2890.5,
                    "pe_ratio": 28.4,
                    "ev_ebitda": 22.1,
                    "ev_revenue": 6.8,
                    "price": 185.42,
                    "change_percent": 1.2
                },
                {
                    "ticker": "MSFT", 
                    "name": "Microsoft Corporation",
                    "market_cap": 2750.3,
                    "pe_ratio": 32.1,
                    "ev_ebitda": 24.8,
                    "ev_revenue": 12.5,
                    "price": 371.15,
                    "change_percent": -0.8
                }
            ],
            "quartiles": {
                "pe_ratio": {"q1": 18.2, "median": 24.5, "q3": 31.7},
                "ev_ebitda": {"q1": 14.1, "median": 18.2, "q3": 25.3},
                "ev_revenue": {"q1": 4.2, "median": 7.8, "q3": 12.1}
            }
        }
        return mock_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}")
@cache_result(expire=600)  # Cache for 10 minutes  
async def get_comps_detail(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Get detailed comparable analysis for a specific company."""
    try:
        # Mock response for now
        mock_detail = {
            "company": {
                "ticker": ticker.upper(),
                "name": f"{ticker.upper()} Corporation",
                "sector": "Technology",
                "market_cap": 150.5,
                "pe_ratio": 26.3,
                "ev_ebitda": 19.8,
                "ev_revenue": 8.2
            },
            "peers": [
                {
                    "ticker": "PEER1",
                    "name": "Peer Company 1",
                    "market_cap": 145.2,
                    "pe_ratio": 24.1,
                    "ev_ebitda": 18.5,
                    "ev_revenue": 7.8,
                    "premium_discount": -0.08
                },
                {
                    "ticker": "PEER2",
                    "name": "Peer Company 2", 
                    "market_cap": 168.9,
                    "pe_ratio": 29.2,
                    "ev_ebitda": 22.1,
                    "ev_revenue": 9.1,
                    "premium_discount": 0.12
                }
            ],
            "valuation_ranges": {
                "pe_implied": {"low": 22.5, "mid": 26.3, "high": 31.8},
                "ev_ebitda_implied": {"low": 17.2, "mid": 19.8, "high": 24.1}
            }
        }
        return mock_detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
