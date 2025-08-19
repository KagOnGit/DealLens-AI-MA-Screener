from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class CompsPeerData(BaseModel):
    ticker: str
    name: str
    market_cap: float
    pe_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    ev_revenue: Optional[float] = None
    price: Optional[float] = None
    change_percent: Optional[float] = None


class CompsResponse(BaseModel):
    summary: Dict[str, Any]
    peers: List[CompsPeerData]
    quartiles: Dict[str, Dict[str, float]]


class CompsDetail(BaseModel):
    company: Dict[str, Any]
    peers: List[Dict[str, Any]]
    valuation_ranges: Dict[str, Dict[str, float]]
