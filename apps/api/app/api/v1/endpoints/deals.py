from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, func, text
from typing import Optional, List
from datetime import datetime, timedelta, date
import logging
import uuid
import hashlib

from app.core.database import get_db
from app.models.deal import Deal, DealStatus, DealType
from app.models.company import Company
from app.models.market_data import NewsItem
from app.schemas.responses import (
    DealsListItem,
    DealDetailPage,
    DealsResponse,
    DealParty,
    DealKPI,
    DealTimelineEntry,
    DealNewsItem
)
from app.utils.cache import (
    CacheKeyBuilder,
    cache_manager,
    hash_dict
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["deals"])


def _get_size_bucket(value: Optional[float]) -> str:
    """Get size bucket for deal value"""
    if not value:
        return "Unknown"
    
    if value < 500:
        return "<$500M"
    elif value < 1000:
        return "$500M-$1B"
    elif value < 10000:
        return "$1B-$10B"
    elif value < 50000:
        return "$10B-$50B"
    else:
        return "$50B+"


def _map_deal_status(db_status: str) -> str:
    """Map database status to frontend status"""
    status_map = {
        "announced": "Announced",
        "pending_regulatory": "Pending",
        "regulatory_approved": "Pending",
        "completed": "Closed",
        "terminated": "Terminated",
        "withdrawn": "Terminated"
    }
    return status_map.get(db_status, "Announced")


def _generate_mock_deals_data() -> List[dict]:
    """Generate mock deals data"""
    import random
    
    mock_deals = [
        {
            "id": "msft-atvi",
            "title": "Microsoft acquires Activision Blizzard",
            "date": "2022-01-18T00:00:00Z",
            "value_usd": 68700.0,
            "status": "Closed",
            "acquirer": "Microsoft Corporation",
            "target": "Activision Blizzard Inc.",
            "industry": "Technology",
            "sizeBucket": "$50B+"
        },
        {
            "id": "amzn-wholefoods",
            "title": "Amazon acquires Whole Foods Market",
            "date": "2017-06-16T00:00:00Z",
            "value_usd": 13700.0,
            "status": "Closed",
            "acquirer": "Amazon.com Inc.",
            "target": "Whole Foods Market Inc.",
            "industry": "Consumer Discretionary",
            "sizeBucket": "$10B-$50B"
        },
        {
            "id": "meta-giphy",
            "title": "Meta divests Giphy to Shutterstock",
            "date": "2022-10-13T00:00:00Z",
            "value_usd": 53.0,
            "status": "Closed",
            "acquirer": "Shutterstock Inc.",
            "target": "Giphy Inc.",
            "industry": "Technology",
            "sizeBucket": "<$500M"
        },
        {
            "id": "aapl-beats",
            "title": "Apple acquires Beats Electronics",
            "date": "2014-05-28T00:00:00Z",
            "value_usd": 3000.0,
            "status": "Closed",
            "acquirer": "Apple Inc.",
            "target": "Beats Electronics LLC",
            "industry": "Technology",
            "sizeBucket": "$1B-$10B"
        },
        {
            "id": "nvda-arm-failed",
            "title": "NVIDIA-ARM deal terminated",
            "date": "2020-09-14T00:00:00Z",
            "value_usd": 40000.0,
            "status": "Terminated",
            "acquirer": "NVIDIA Corporation",
            "target": "ARM Holdings",
            "industry": "Technology",
            "sizeBucket": "$10B-$50B"
        }
    ]
    
    # Add some random deals
    companies = ["TechCorp", "DataInc", "CloudSys", "FinanceX", "HealthTech", "RetailPlus"]
    industries = ["Technology", "Healthcare", "Financial Services", "Consumer Discretionary", "Energy"]
    
    for i in range(10):
        acquirer = random.choice(companies)
        target = random.choice([c for c in companies if c != acquirer])
        value = random.uniform(100, 25000)
        
        mock_deals.append({
            "id": f"deal-{i+6}",
            "title": f"{acquirer} acquires {target}",
            "date": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "value_usd": round(value, 2),
            "status": random.choice(["Announced", "Pending", "Closed", "Terminated"]),
            "acquirer": f"{acquirer} Inc.",
            "target": f"{target} Ltd.",
            "industry": random.choice(industries),
            "sizeBucket": _get_size_bucket(value)
        })
    
    return mock_deals


def _generate_mock_deal_detail(deal_id: str) -> dict:
    """Generate mock deal detail data"""
    import random
    
    mock_details = {
        "msft-atvi": {
            "id": "msft-atvi",
            "title": "Microsoft acquires Activision Blizzard for $68.7B",
            "status": "Closed",
            "announced_at": "2022-01-18T00:00:00Z",
            "closed_at": "2023-10-13T00:00:00Z",
            "value_usd": 68700.0,
            "premium_pct": 45.3,
            "multiple_ev_ebitda": 13.8,
            "parties": [
                {
                    "name": "Microsoft Corporation",
                    "ticker": "MSFT",
                    "role": "Acquirer",
                    "industry": "Technology",
                    "country": "United States"
                },
                {
                    "name": "Activision Blizzard Inc.",
                    "ticker": "ATVI",
                    "role": "Target",
                    "industry": "Gaming",
                    "country": "United States"
                }
            ],
            "overview": "Microsoft's acquisition of Activision Blizzard represents the largest gaming acquisition in history.",
            "rationale": [
                "Accelerate growth in Microsoft's gaming business",
                "Acquire world-class content and franchises",
                "Enhance Game Pass subscription service",
                "Strengthen mobile gaming position"
            ],
            "kpis": [
                {"label": "Transaction Value", "value": "$68.7B", "hint": "All-cash transaction"},
                {"label": "Premium to Market Price", "value": "45.3%", "deltaPct": 45.3},
                {"label": "EV/EBITDA Multiple", "value": "13.8x", "hint": "Based on 2022 EBITDA"}
            ],
            "timeline": [
                {
                    "date": "2022-01-18T00:00:00Z",
                    "title": "Deal Announced",
                    "description": "Microsoft announces intent to acquire Activision Blizzard",
                    "type": "Announcement"
                },
                {
                    "date": "2023-10-13T00:00:00Z",
                    "title": "Transaction Closes",
                    "description": "Deal officially completed",
                    "type": "Closing"
                }
            ],
            "news": [
                {
                    "id": "news-1",
                    "title": "Microsoft Completes $69 Billion Activision Blizzard Deal",
                    "source": "Wall Street Journal",
                    "url": "https://wsj.com/microsoft-activision",
                    "published_at": "2023-10-13T16:00:00Z",
                    "sentiment": "positive",
                    "relevance": 0.98,
                    "summary": "Historic deal completed after regulatory approval"
                }
            ]
        }
    }
    
    # Return mock detail or generate generic one
    if deal_id in mock_details:
        return mock_details[deal_id]
    
    # Generate generic deal detail
    return {
        "id": deal_id,
        "title": f"Generic Deal {deal_id}",
        "status": "Announced",
        "announced_at": datetime.now().isoformat(),
        "value_usd": round(random.uniform(100, 10000), 2),
        "premium_pct": round(random.uniform(10, 40), 1),
        "multiple_ev_ebitda": round(random.uniform(8, 25), 1),
        "parties": [
            {
                "name": "Acquirer Corp",
                "ticker": "ACQ",
                "role": "Acquirer",
                "industry": "Technology",
                "country": "United States"
            },
            {
                "name": "Target Inc",
                "ticker": "TGT",
                "role": "Target",
                "industry": "Technology",
                "country": "United States"
            }
        ],
        "overview": "Strategic acquisition to enhance market position.",
        "rationale": ["Market expansion", "Synergy realization", "Technology integration"],
        "kpis": [
            {"label": "Transaction Value", "value": f"${random.randint(1, 100)}B", "hint": "Enterprise value"}
        ],
        "timeline": [
            {
                "date": datetime.now().isoformat(),
                "title": "Deal Announced",
                "description": "Initial announcement",
                "type": "Announcement"
            }
        ],
        "news": []
    }


@router.get("/deals", response_model=DealsResponse)
async def get_deals(
    industry: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    size: Optional[str] = Query(None),
    startDate: Optional[str] = Query(None),
    endDate: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    q: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get deals with filtering and pagination"""
    logger.info(f"Getting deals with filters: industry={industry}, status={status}, size={size}, q={q}")
    
    # Create cache key from filters
    filters = {
        "industry": industry,
        "status": status,
        "size": size,
        "startDate": startDate,
        "endDate": endDate,
        "page": page,
        "q": q
    }
    filters_hash = hash_dict({k: v for k, v in filters.items() if v is not None})
    
    # Try cache first
    cache_key = CacheKeyBuilder.deals_list(filters_hash)
    cached_data = cache_manager.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for deals list: {filters_hash}")
        return cached_data
    
    # Generate mock deals data
    all_deals = _generate_mock_deals_data()
    
    # Apply filters
    filtered_deals = all_deals
    
    if industry and industry != "All":
        filtered_deals = [d for d in filtered_deals if industry.lower() in d.get("industry", "").lower()]
    
    if status and status != "All":
        filtered_deals = [d for d in filtered_deals if d.get("status") == status]
    
    if size and size != "All":
        filtered_deals = [d for d in filtered_deals if d.get("sizeBucket") == size]
    
    if q:
        query = q.lower()
        filtered_deals = [
            d for d in filtered_deals
            if query in d.get("title", "").lower()
            or query in d.get("acquirer", "").lower()
            or query in d.get("target", "").lower()
        ]
    
    # Apply date filters
    if startDate:
        try:
            start_dt = datetime.fromisoformat(startDate.replace('Z', '+00:00'))
            filtered_deals = [
                d for d in filtered_deals
                if datetime.fromisoformat(d["date"].replace('Z', '+00:00')) >= start_dt
            ]
        except ValueError:
            pass  # Invalid date format, skip filter
    
    if endDate:
        try:
            end_dt = datetime.fromisoformat(endDate.replace('Z', '+00:00'))
            filtered_deals = [
                d for d in filtered_deals
                if datetime.fromisoformat(d["date"].replace('Z', '+00:00')) <= end_dt
            ]
        except ValueError:
            pass  # Invalid date format, skip filter
    
    # Sort by date (newest first)
    filtered_deals.sort(key=lambda x: x["date"], reverse=True)
    
    # Pagination
    page_size = 20
    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_deals = filtered_deals[start_idx:end_idx]
    
    response = {
        "deals": paginated_deals,
        "total": len(filtered_deals)
    }
    
    # Cache the result
    cache_manager.set(cache_key, response, 60)  # 1 minute
    
    return response


@router.get("/deals/{id}", response_model=DealDetailPage)
async def get_deal_detail(
    id: str,
    db: Session = Depends(get_db)
):
    """Get detailed deal information by ID"""
    logger.info(f"Getting deal detail for {id}")
    
    # Try cache first
    cache_key = CacheKeyBuilder.deal_detail(id)
    cached_data = cache_manager.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for deal detail: {id}")
        return cached_data
    
    # Generate mock deal detail
    detail = _generate_mock_deal_detail(id)
    
    if not detail:
        raise HTTPException(status_code=404, detail=f"Deal with ID {id} not found")
    
    # Cache the result
    cache_manager.set(cache_key, detail, 300)  # 5 minutes
    
    return detail


@router.get("/recent")
async def get_recent_deals():
    """Get recent deals - legacy endpoint"""
    return {
        "deals": [
            {
                "id": "1",
                "acquirer": "TechCorp Inc.",
                "target": "StartupAI Ltd.",
                "value": "$500M",
                "status": "announced",
                "date": "2024-01-15"
            },
            {
                "id": "2", 
                "acquirer": "MegaBank",
                "target": "FinTech Solutions",
                "value": "$1.2B",
                "status": "completed",
                "date": "2024-01-10"
            }
        ]
    }
