from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

class DealBase(BaseModel):
    company_id: Optional[int] = None
    title: Optional[str] = None
    status: Optional[str] = None  # e.g. "announced", "closed", "rumor"
    value: Optional[float] = None
    currency: Optional[str] = None
    announced_date: Optional[date] = None

class DealCreate(DealBase):
    company_id: int
    title: str

class DealUpdate(DealBase):
    pass

class Deal(DealBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
