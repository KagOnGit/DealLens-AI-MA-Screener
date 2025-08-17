# apps/api/app/schemas/company.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal

class CompanyBase(BaseModel):
    ticker: Optional[str] = None
    name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    market_cap: Optional[Decimal] = None
    employees: Optional[int] = None
    founded_year: Optional[int] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None
    is_public: bool = True
    is_active: bool = True

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    ticker: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    industry: Optional[str] = None
    sector: Optional[str] = None
    country: Optional[str] = None
    market_cap: Optional[Decimal] = None
    employees: Optional[int] = None
    founded_year: Optional[int] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None

class Company(CompanyBase):
    id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CompanyScreeningCriteria(BaseModel):
    min_market_cap: Optional[Decimal] = None
    max_market_cap: Optional[Decimal] = None
    industries: Optional[list[str]] = None
    sectors: Optional[list[str]] = None
    countries: Optional[list[str]] = None
    min_employees: Optional[int] = None
    max_employees: Optional[int] = None
    min_founded_year: Optional[int] = None
    max_founded_year: Optional[int] = None
    is_public: Optional[bool] = None

class CompanyListResponse(BaseModel):
    items: list[Company]
    total: int
    page: int
    page_size: int
    total_pages: int
