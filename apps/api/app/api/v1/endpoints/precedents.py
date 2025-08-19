from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class Advisors(BaseModel):
    buy: List[str]
    sell: List[str]

class PrecedentDeal(BaseModel):
    id: str
    acquirer: str
    target: str
    announced: str
    status: str
    industry: str
    value: int  # millions
    ev_ebitda: float
    premium: float
    cash_percent: float
    stock_percent: float
    advisors: Advisors

class PrecedentSummary(BaseModel):
    total_value: int  # millions
    median_ev_ebitda: float
    median_premium: float

class PrecedentsResponse(BaseModel):
    items: List[PrecedentDeal]
    summary: PrecedentSummary

# Mock precedent deals data
MOCK_PRECEDENTS = [
    PrecedentDeal(
        id="msft-atvi",
        acquirer="Microsoft Corporation",
        target="Activision Blizzard Inc.",
        announced="2022-01-18",
        status="Completed",
        industry="Technology",
        value=68700,
        ev_ebitda=18.8,
        premium=45.3,
        cash_percent=100.0,
        stock_percent=0.0,
        advisors=Advisors(buy=["Allen & Company"], sell=["Goldman Sachs", "J.P. Morgan"])
    ),
    PrecedentDeal(
        id="avgo-vmw",
        acquirer="Broadcom Inc.",
        target="VMware Inc.",
        announced="2022-05-26",
        status="Completed",
        industry="Technology",
        value=69000,
        ev_ebitda=19.2,
        premium=49.0,
        cash_percent=100.0,
        stock_percent=0.0,
        advisors=Advisors(buy=["Goldman Sachs", "J.P. Morgan"], sell=["Morgan Stanley", "Credit Suisse"])
    ),
    PrecedentDeal(
        id="pfe-sgen",
        acquirer="Pfizer Inc.",
        target="Seagen Inc.",
        announced="2023-03-13",
        status="Completed",
        industry="Healthcare",
        value=43000,
        ev_ebitda=25.8,
        premium=32.8,
        cash_percent=100.0,
        stock_percent=0.0,
        advisors=Advisors(buy=["Morgan Stanley", "Guggenheim"], sell=["Goldman Sachs", "Evercore"])
    ),
    PrecedentDeal(
        id="cvx-hes",
        acquirer="Chevron Corporation",
        target="Hess Corporation",
        announced="2023-10-23",
        status="Pending",
        industry="Energy",
        value=53000,
        ev_ebitda=12.5,
        premium=10.5,
        cash_percent=0.0,
        stock_percent=100.0,
        advisors=Advisors(buy=["Goldman Sachs"], sell=["J.P. Morgan", "Barclays"])
    ),
    PrecedentDeal(
        id="xom-pxd",
        acquirer="ExxonMobil Corporation",
        target="Pioneer Natural Resources",
        announced="2023-10-11",
        status="Pending",
        industry="Energy",
        value=59500,
        ev_ebitda=8.9,
        premium=18.0,
        cash_percent=0.0,
        stock_percent=100.0,
        advisors=Advisors(buy=["Goldman Sachs", "Morgan Stanley"], sell=["J.P. Morgan"])
    ),
    PrecedentDeal(
        id="amgn-hznp",
        acquirer="Amgen Inc.",
        target="Horizon Therapeutics",
        announced="2022-12-12",
        status="Completed",
        industry="Healthcare",
        value=27800,
        ev_ebitda=22.4,
        premium=47.9,
        cash_percent=100.0,
        stock_percent=0.0,
        advisors=Advisors(buy=["J.P. Morgan", "BofA Securities"], sell=["Goldman Sachs", "Morgan Stanley"])
    )
]

@router.get("/", response_model=PrecedentsResponse)
async def get_precedents(
    industry: Optional[str] = Query(None, description="Filter by industry"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """Get precedent transactions with filters."""
    
    items = list(MOCK_PRECEDENTS)
    
    # Apply filters
    if industry and industry.lower() != "all":
        items = [item for item in items if industry.lower() in item.industry.lower()]
    if status and status.lower() != "all":
        items = [item for item in items if status.lower() in item.status.lower()]
    
    # Calculate summary
    if items:
        total_value = sum(deal.value for deal in items)
        ev_ebitda_values = sorted([deal.ev_ebitda for deal in items])
        premium_values = sorted([deal.premium for deal in items])
        
        median_ev_ebitda = ev_ebitda_values[len(ev_ebitda_values) // 2]
        median_premium = premium_values[len(premium_values) // 2]
    else:
        total_value = 0
        median_ev_ebitda = 0.0
        median_premium = 0.0
    
    summary = PrecedentSummary(
        total_value=total_value,
        median_ev_ebitda=median_ev_ebitda,
        median_premium=median_premium
    )
    
    return PrecedentsResponse(items=items, summary=summary)
