from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ....core.database import get_db
from ....models.company import Company as CompanyModel
from ....schemas.company import (
    Company, 
    CompanyCreate, 
    CompanyUpdate, 
    CompanyScreeningCriteria,
    CompanyListResponse
)

router = APIRouter()


@router.get("/", response_model=CompanyListResponse)
async def get_companies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    search: str = Query(None, description="Search term for company name or ticker"),
    industry: str = Query(None, description="Filter by industry"),
    sector: str = Query(None, description="Filter by sector"),
    country: str = Query(None, description="Filter by country"),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Retrieve companies with optional filtering and pagination.
    """
    query = select(CompanyModel).filter(CompanyModel.is_active == True)
    
    # Apply filters
    if search:
        search_filter = f"%{search.lower()}%"
        query = query.filter(
            func.lower(CompanyModel.name).contains(search_filter) |
            func.lower(CompanyModel.ticker).contains(search_filter)
        )
    
    if industry:
        query = query.filter(CompanyModel.industry == industry)
    
    if sector:
        query = query.filter(CompanyModel.sector == sector)
        
    if country:
        query = query.filter(CompanyModel.country == country)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(CompanyModel.name)
    
    result = await db.execute(query)
    companies = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    return CompanyListResponse(
        items=[Company.model_validate(company) for company in companies],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
        total_pages=total_pages
    )


@router.post("/", response_model=Company)
async def create_company(
    company: CompanyCreate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Create new company.
    """
    import uuid
    
    # Check if ticker already exists (if provided)
    if company.ticker:
        existing = await db.execute(
            select(CompanyModel).filter(CompanyModel.ticker == company.ticker)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Company with ticker '{company.ticker}' already exists"
            )
    
    db_company = CompanyModel(
        id=str(uuid.uuid4()),
        **company.model_dump()
    )
    
    db.add(db_company)
    await db.commit()
    await db.refresh(db_company)
    
    return Company.model_validate(db_company)


@router.get("/{company_id}", response_model=Company)
async def get_company(
    company_id: str,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Get company by ID.
    """
    result = await db.execute(
        select(CompanyModel).filter(CompanyModel.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )
    
    return Company.model_validate(company)


@router.put("/{company_id}", response_model=Company)
async def update_company(
    company_id: str,
    company_update: CompanyUpdate,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Update company.
    """
    result = await db.execute(
        select(CompanyModel).filter(CompanyModel.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found"
        )
    
    update_data = company_update.model_dump(exclude_unset=True)
    
    # Check ticker uniqueness if being updated
    if "ticker" in update_data and update_data["ticker"]:
        existing = await db.execute(
            select(CompanyModel).filter(
                CompanyModel.ticker == update_data["ticker"],
                CompanyModel.id != company_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail=f"Company with ticker '{update_data['ticker']}' already exists"
            )
    
    for field, value in update_data.items():
        setattr(company, field, value)
    
    await db.commit()
    await db.refresh(company)
    
    return Company.model_validate(company)


@router.post("/screen", response_model=CompanyListResponse)
async def screen_companies(
    criteria: CompanyScreeningCriteria,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Screen companies based on criteria.
    """
    query = select(CompanyModel).filter(CompanyModel.is_active == True)
    
    # Apply screening criteria
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
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.offset(skip).limit(limit).order_by(CompanyModel.market_cap.desc().nulls_last())
    
    result = await db.execute(query)
    companies = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    return CompanyListResponse(
        items=[Company.model_validate(company) for company in companies],
        total=total,
        page=(skip // limit) + 1,
        page_size=limit,
        total_pages=total_pages
    )
