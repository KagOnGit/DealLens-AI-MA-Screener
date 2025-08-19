from fastapi import APIRouter, Query
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class Advisor(BaseModel):
    name: str
    rank: int
    deal_count: int
    total_value: int  # millions
    avg_size: int  # millions
    share_pct: float

class LeagueTablesResponse(BaseModel):
    advisors: List[Advisor]

# Mock league table data
MOCK_ADVISORS = [
    Advisor(name="Goldman Sachs", rank=1, deal_count=45, total_value=125000, avg_size=2778, share_pct=18.5),
    Advisor(name="Morgan Stanley", rank=2, deal_count=42, total_value=115000, avg_size=2738, share_pct=17.0),
    Advisor(name="J.P. Morgan", rank=3, deal_count=38, total_value=98000, avg_size=2579, share_pct=14.5),
    Advisor(name="Bank of America", rank=4, deal_count=35, total_value=89000, avg_size=2543, share_pct=13.2),
    Advisor(name="Citigroup", rank=5, deal_count=32, total_value=78000, avg_size=2438, share_pct=11.5),
    Advisor(name="Barclays", rank=6, deal_count=28, total_value=65000, avg_size=2321, share_pct=9.6),
    Advisor(name="Credit Suisse", rank=7, deal_count=25, total_value=58000, avg_size=2320, share_pct=8.6),
    Advisor(name="Deutsche Bank", rank=8, deal_count=22, total_value=48000, avg_size=2182, share_pct=7.1),
    Advisor(name="Wells Fargo Securities", rank=9, deal_count=20, total_value=42000, avg_size=2100, share_pct=6.2),
    Advisor(name="RBC Capital Markets", rank=10, deal_count=18, total_value=35000, avg_size=1944, share_pct=5.2)
]

@router.get("/", response_model=LeagueTablesResponse)
async def get_league_tables(
    period: str = Query("YTD", description="Time period: YTD, 1Y, 3Y"),
    industry: Optional[str] = Query(None, description="Filter by industry")
):
    """Get advisor league tables with rankings."""
    
    # In real implementation, would filter by period and industry
    # For now, return mock data with slight variations based on filters
    advisors = list(MOCK_ADVISORS)
    
    # Simulate filtering by industry (reduce counts/values)
    if industry and industry.lower() not in ["all", None]:
        for advisor in advisors:
            # Reduce metrics for industry-specific view
            advisor.deal_count = int(advisor.deal_count * 0.6)
            advisor.total_value = int(advisor.total_value * 0.7)
            advisor.avg_size = advisor.total_value // advisor.deal_count if advisor.deal_count > 0 else 0
    
    # Simulate period variations
    if period == "1Y":
        for advisor in advisors:
            advisor.deal_count = int(advisor.deal_count * 1.2)
            advisor.total_value = int(advisor.total_value * 1.1)
    elif period == "3Y":
        for advisor in advisors:
            advisor.deal_count = int(advisor.deal_count * 2.8)
            advisor.total_value = int(advisor.total_value * 2.5)
    
    # Recalculate share percentages
    total_market_value = sum(advisor.total_value for advisor in advisors)
    for advisor in advisors:
        advisor.share_pct = round((advisor.total_value / total_market_value) * 100, 1) if total_market_value > 0 else 0.0
        advisor.avg_size = advisor.total_value // advisor.deal_count if advisor.deal_count > 0 else 0
    
    return LeagueTablesResponse(advisors=advisors)
