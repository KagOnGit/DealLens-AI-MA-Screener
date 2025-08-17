from __future__ import annotations

from typing import Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ....core.database import get_db
from ....models.company import Company as CompanyModel
from .....schemas.company import (
    Company,
    CompanyCreate,
    CompanyUpdate,
    CompanyListResponse,
    CompanyScreeningCriteria,
)

router = APIRouter(prefix="/companies", tags=["companies"])


def apply_updates(obj: CompanyModel, data: CompanyUpdate) -> CompanyModel:
    """Apply non-None fields from CompanyUpdate to the SQLAlchemy object."""
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, field, value)
    return obj


@router.get("/", response_model=CompanyListResponse)
def list_companies(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    q: Optional[str] = Query(None, description="Search by ticker or name"),
    sector: Optional[str] = None,
    industry: Optional[str] = None,
    country: Optional[str] = None,
    is_public: Optional[bool] = None,
    is_active: Optional[bool] = True,
) -> Any:
    query = db.query(CompanyModel)

    if q:
        like = f"%{q}%"
        query = query.filter(
            (CompanyModel.ticker.ilike(like)) | (CompanyModel.name.ilike(like))
        )
    if sector:
        query = query.filter(CompanyModel.sector == sector)
    if industry:
        query = query.filter(CompanyModel.industry == industry)
    if country:
        query = query.filter(CompanyModel.country == country)
    if is_public is not None:
        query = query.filter(CompanyModel.is_public == is_public)
    if is_active is not None:
        query = query.filter(CompanyModel.is_active == is_active)

    total = query.with_entities(func.count(CompanyModel.id)).scalar() or 0
    items: List[CompanyModel] = (
        query.order_by(CompanyModel.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return CompanyListResponse(
        items=[Company.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if page_size else 1,
    )


@router.get("/{company_id}", response_model=Company)
def get_company(company_id: str, db: Session = Depends(get_db)) -> Any:
    obj = db.query(CompanyModel).get(company_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Company not found")
    return Company.model_validate(obj)


@router.post("/", response_model=Company, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)) -> Any:
    obj = CompanyModel(**payload.model_dump(exclude_unset=True))
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return Company.model_validate(obj)


@router.put("/{company_id}", response_model=Company)
def update_company(
    company_id: str, payload: CompanyUpdate, db: Session = Depends(get_db)
) -> Any:
    obj = db.query(CompanyModel).get(company_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Company not found")

    obj = apply_updates(obj, payload)
    db.commit()
    db.refresh(obj)
    return Company.model_validate(obj)


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: str, db: Session = Depends(get_db)) -> None:
    obj = db.query(CompanyModel).get(company_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Company not found")
    db.delete(obj)
    db.commit()
    return None


@router.post("/screen", response_model=CompanyListResponse)
def screen_companies(
    criteria: CompanyScreeningCriteria,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> Any:
    query = db.query(CompanyModel)

    if criteria.min_market_cap is not None:
        query = query.filter(CompanyModel.market_cap >= criteria.min_market_cap)
    if criteria.max_market_cap is not None:
        query = query.filter(CompanyModel.market_cap <= criteria.max_market_cap)
    if criteria.industries:
        query = query.filter(CompanyModel.industry.in_(criteria.industries))
    if criteria.sectors:
        query = query.filter(CompanyModel.sector.in_(criteria.sectors))
    if criteria.countries:
        query = query.filter(CompanyModel.country.in_(criteria.countries))
    if criteria.min_employees is not None:
        query = query.filter(CompanyModel.employees >= criteria.min_employees)
    if criteria.max_employees is not None:
        query = query.filter(CompanyModel.employees <= criteria.max_employees)
    if criteria.min_founded_year is not None:
        query = query.filter(CompanyModel.founded_year >= criteria.min_founded_year)
    if criteria.max_founded_year is not None:
        query = query.filter(CompanyModel.founded_year <= criteria.max_founded_year)
    if criteria.is_public is not None:
        query = query.filter(CompanyModel.is_public == criteria.is_public)

    total = query.with_entities(func.count(CompanyModel.id)).scalar() or 0
    items: List[CompanyModel] = (
        query.order_by(CompanyModel.updated_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return CompanyListResponse(
        items=[Company.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if page_size else 1,
    )