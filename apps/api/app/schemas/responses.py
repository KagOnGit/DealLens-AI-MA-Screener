"""
Response schemas that mirror the frontend TypeScript types exactly.
These are read-only schemas used for API responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Union
from datetime import datetime


# ============================================================================
# Company Response Schemas
# ============================================================================

class Company(BaseModel):
    ticker: str
    name: str
    sector: str
    industry: str
    market_cap: float
    price: float
    change: float
    change_percent: float
    volume: Optional[int] = None
    pe_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    revenue: Optional[float] = None
    employees: Optional[int] = None
    headquarters: Optional[str] = None
    founded: Optional[int] = None
    description: Optional[str] = None
    website: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyDetail(Company):
    beta: Optional[float] = None
    currency: str = "USD"
    updated_at: str
    business_summary: Optional[str] = None
    key_risks: Optional[List[str]] = None
    competitive_moats: Optional[List[str]] = None

    class Config:
        from_attributes = True


class TimeseriesPoint(BaseModel):
    date: str
    value: float


class MarginPoint(BaseModel):
    date: str
    gross: float
    ebitda: float
    net: float


class MultiplePoint(BaseModel):
    date: str
    pe: float
    ev_ebitda: float


class CompanyTimeseries(BaseModel):
    revenue: List[TimeseriesPoint]
    ebitda: List[TimeseriesPoint]
    fcf: List[TimeseriesPoint]
    margins: List[MarginPoint]
    multiples: List[MultiplePoint]


class OwnershipSlice(BaseModel):
    label: str
    value: float
    color: Optional[str] = None


class TopHolder(BaseModel):
    name: str
    percentage: float
    shares: int


class InsiderActivity(BaseModel):
    date: str
    type: str  # 'buy' | 'sell'
    shares: int
    value: float
    person: str


class CompanyOwnership(BaseModel):
    slices: List[OwnershipSlice]
    top_holders: Optional[List[TopHolder]] = None
    insider_activity: Optional[List[InsiderActivity]] = None


class CompanyNews(BaseModel):
    id: str
    headline: str
    source: str
    published_at: str
    url: str
    summary: Optional[str] = None
    relevance_score: Optional[float] = None
    sentiment: Optional[str] = None  # 'positive' | 'negative' | 'neutral'


class CompaniesResponse(BaseModel):
    companies: List[Company]
    total: int
    page: int
    per_page: int


# ============================================================================
# Deal Response Schemas
# ============================================================================

class DealParty(BaseModel):
    name: str
    ticker: Optional[str] = None
    role: str  # 'Acquirer' | 'Target'
    industry: Optional[str] = None
    country: Optional[str] = None


class DealKPI(BaseModel):
    label: str
    value: Union[str, float, int]
    hint: Optional[str] = None
    deltaPct: Optional[float] = None


class DealTimelineEntry(BaseModel):
    date: str
    title: str
    description: Optional[str] = None
    type: str  # 'Announcement' | 'Regulatory' | 'Shareholder' | 'Closing' | 'Rumor' | 'Other'


class DealNewsItem(BaseModel):
    id: str
    title: str
    source: str
    url: str
    published_at: str
    sentiment: str  # 'positive' | 'neutral' | 'negative'
    relevance: float  # 0..1
    summary: Optional[str] = None


class DealsListItem(BaseModel):
    id: str
    title: str
    date: str  # ISO (announced)
    value_usd: Optional[float] = None
    status: str  # 'Announced' | 'Pending' | 'Closed' | 'Terminated'
    acquirer: Optional[str] = None
    target: Optional[str] = None
    industry: Optional[str] = None
    sizeBucket: Optional[str] = None


class DealDetailPage(BaseModel):
    id: str
    title: str
    status: str  # 'Announced' | 'Pending' | 'Closed' | 'Terminated'
    announced_at: Optional[str] = None
    closed_at: Optional[str] = None
    value_usd: Optional[float] = None
    premium_pct: Optional[float] = None
    multiple_ev_ebitda: Optional[float] = None
    parties: List[DealParty]
    overview: str
    rationale: Optional[List[str]] = None
    kpis: List[DealKPI]
    timeline: List[DealTimelineEntry]
    news: List[DealNewsItem]


class DealsResponse(BaseModel):
    deals: List[DealsListItem]
    total: int


class DealsStats(BaseModel):
    byMonth: List[dict]  # { month: str, count: int }
    byIndustry: List[dict]  # { industry: str, count: int }
    bySize: List[dict]  # { bucket: str, count: int }


# ============================================================================
# Search Response Schemas
# ============================================================================

class Suggestion(BaseModel):
    type: str  # 'company' | 'deal' | 'ticker'
    id: Optional[str] = None
    label: str
    value: str
    subtitle: Optional[str] = None
    ticker: Optional[str] = None


class SuggestionsResponse(BaseModel):
    suggestions: List[Suggestion]


# ============================================================================
# Debug Response Schemas
# ============================================================================

class ContractExample(BaseModel):
    endpoint: str
    method: str
    example_response: dict


class DebugContractsResponse(BaseModel):
    contracts: List[ContractExample]
    generated_at: str
