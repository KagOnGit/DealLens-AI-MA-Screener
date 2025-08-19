from fastapi import APIRouter, Query
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter()

class CompItem(BaseModel):
    ticker: str
    name: str
    sector: str
    price: float
    market_cap: int  # millions
    pe: float
    ev_ebitda: float
    rev_growth: float
    ebitda_margin: float
    ndebt: int  # millions

class CompSummary(BaseModel):
    median_pe: float
    median_ev_ebitda: float
    count: int

class CompsResponse(BaseModel):
    items: List[CompItem]
    total: int
    page: int
    limit: int
    summary: CompSummary

# Mock data for major companies
MOCK_COMPS_DATA = [
    CompItem(
        ticker="AAPL", name="Apple Inc.", sector="Technology", price=180.50,
        market_cap=2800000, pe=28.5, ev_ebitda=22.1, rev_growth=8.2, 
        ebitda_margin=29.5, ndebt=15000
    ),
    CompItem(
        ticker="MSFT", name="Microsoft Corporation", sector="Technology", price=378.25,
        market_cap=2700000, pe=32.1, ev_ebitda=24.8, rev_growth=12.1, 
        ebitda_margin=42.1, ndebt=22000
    ),
    CompItem(
        ticker="GOOGL", name="Alphabet Inc.", sector="Communication Services", price=135.80,
        market_cap=1700000, pe=25.4, ev_ebitda=18.9, rev_growth=9.8, 
        ebitda_margin=27.3, ndebt=8500
    ),
    CompItem(
        ticker="AMZN", name="Amazon.com Inc.", sector="Consumer Discretionary", price=142.33,
        market_cap=1400000, pe=45.2, ev_ebitda=26.4, rev_growth=15.3, 
        ebitda_margin=8.2, ndebt=35000
    ),
    CompItem(
        ticker="TSLA", name="Tesla Inc.", sector="Consumer Discretionary", price=238.45,
        market_cap=800000, pe=65.8, ev_ebitda=42.1, rev_growth=28.5, 
        ebitda_margin=9.2, ndebt=5000
    ),
    CompItem(
        ticker="META", name="Meta Platforms Inc.", sector="Communication Services", price=298.67,
        market_cap=750000, pe=22.7, ev_ebitda=15.3, rev_growth=6.8, 
        ebitda_margin=34.4, ndebt=0
    ),
    CompItem(
        ticker="NVDA", name="NVIDIA Corporation", sector="Technology", price=875.25,
        market_cap=2200000, pe=68.2, ev_ebitda=52.8, rev_growth=126.0, 
        ebitda_margin=73.1, ndebt=1500
    ),
    CompItem(
        ticker="CRM", name="Salesforce Inc.", sector="Technology", price=245.80,
        market_cap=240000, pe=35.6, ev_ebitda=28.9, rev_growth=11.2, 
        ebitda_margin=18.4, ndebt=8200
    )
]

@router.get("/", response_model=CompsResponse)
async def get_comps(
    sector: Optional[str] = Query(None, description="Filter by sector"),
    cap_min: Optional[int] = Query(None, description="Minimum market cap in millions"),
    cap_max: Optional[int] = Query(None, description="Maximum market cap in millions"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(50, ge=1, le=100, description="Items per page"),
    sort: str = Query("ev_ebitda", description="Sort field"),
    order: str = Query("asc", description="Sort order: asc or desc")
):
    """Get comparable companies with filtering and pagination."""
    
    # Start with mock data (in real implementation, query database)
    items = list(MOCK_COMPS_DATA)
    
    # Apply sector filter
    if sector and sector.lower() != "all":
        items = [item for item in items if sector.lower() in item.sector.lower()]
    
    # Apply market cap filters
    if cap_min is not None:
        items = [item for item in items if item.market_cap >= cap_min]
    if cap_max is not None:
        items = [item for item in items if item.market_cap <= cap_max]
    
    # Sort items
    reverse = order.lower() == "desc"
    if sort == "ev_ebitda":
        items.sort(key=lambda x: x.ev_ebitda, reverse=reverse)
    elif sort == "pe":
        items.sort(key=lambda x: x.pe, reverse=reverse)
    elif sort == "market_cap":
        items.sort(key=lambda x: x.market_cap, reverse=reverse)
    elif sort == "rev_growth":
        items.sort(key=lambda x: x.rev_growth, reverse=reverse)
    
    # Calculate summary stats
    if items:
        pe_values = sorted([item.pe for item in items])
        ev_ebitda_values = sorted([item.ev_ebitda for item in items])
        
        median_pe = pe_values[len(pe_values) // 2]
        median_ev_ebitda = ev_ebitda_values[len(ev_ebitda_values) // 2]
    else:
        median_pe = 0.0
        median_ev_ebitda = 0.0
    
    summary = CompSummary(
        median_pe=median_pe,
        median_ev_ebitda=median_ev_ebitda,
        count=len(items)
    )
    
    # Apply pagination
    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    
    return CompsResponse(
        items=paginated_items,
        total=total,
        page=page,
        limit=limit,
        summary=summary
    )
