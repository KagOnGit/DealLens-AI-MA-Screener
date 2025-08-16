from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from ..core.database import get_db
from ..core.deps import get_current_user, get_optional_user
from ..models import Company, OHLCData, NewsItem, AIInsight, Watchlist, User
from ..deps import PaginationParams, FilterParams, paginate_query, apply_sorting, apply_search, cache_get, cache_set, generate_id
from ..services.alpha_vantage import AlphaVantageService
from ..services.news_api import NewsAPIService
from ..services.openai_service import OpenAIService

router = APIRouter()

# Initialize services
alpha_vantage = AlphaVantageService()
news_api = NewsAPIService()
openai_service = OpenAIService()


class CompaniesFilterParams(FilterParams):
    """Company-specific filter parameters."""
    def __init__(
        self,
        sector: Optional[str] = Query(None, description="Filter by sector"),
        min_market_cap: Optional[float] = Query(None, description="Minimum market cap"),
        max_market_cap: Optional[float] = Query(None, description="Maximum market cap"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.sector = sector
        self.min_market_cap = min_market_cap
        self.max_market_cap = max_market_cap


@router.get("", response_model=Dict[str, Any])
async def list_companies(
    db: Session = Depends(get_db),
    pagination: PaginationParams = Depends(),
    filters: CompaniesFilterParams = Depends(),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """List companies with filtering and pagination."""
    
    # Base query
    query = db.query(Company).filter(Company.ticker.isnot(None))
    
    # Apply filters
    if filters.sector:
        query = query.filter(Company.sector.ilike(f"%{filters.sector}%"))
    
    if filters.min_market_cap:
        query = query.filter(Company.market_cap >= filters.min_market_cap)
    
    if filters.max_market_cap:
        query = query.filter(Company.market_cap <= filters.max_market_cap)
    
    # Apply search
    query = apply_search(query, Company, ["name", "ticker", "sector"], filters.query)
    
    # Apply sorting
    query = apply_sorting(query, Company, filters.sort_by or "market_cap", filters.sort_order)
    
    # Paginate results
    result = paginate_query(query, pagination)
    
    # Add watchlist status if user is authenticated
    if current_user:
        company_ids = [company.id for company in result["items"]]
        watchlisted = db.query(Watchlist.company_id).filter(
            and_(Watchlist.user_id == current_user.id, Watchlist.company_id.in_(company_ids))
        ).all()
        watchlisted_ids = {w[0] for w in watchlisted}
        
        for company in result["items"]:
            company.watched = company.id in watchlisted_ids
    else:
        for company in result["items"]:
            company.watched = False
    
    return result


@router.get("/{ticker}", response_model=Dict[str, Any])
async def get_company_detail(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Get detailed company information with market data, news, and AI insights."""
    
    # Check cache first
    cache_key = f"company_detail:{ticker.upper()}"
    cached_data = await cache_get(cache_key)
    
    if cached_data:
        # Add fresh watchlist status for authenticated users
        if current_user:
            watchlist_entry = db.query(Watchlist).filter(
                and_(Watchlist.user_id == current_user.id, 
                     Watchlist.company_id == cached_data["id"])
            ).first()
            cached_data["watched"] = watchlist_entry is not None
        else:
            cached_data["watched"] = False
        return cached_data
    
    # Find company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get recent OHLC data (last 90 days)
    ohlc_data = db.query(OHLCData).filter(
        OHLCData.company_id == company.id
    ).order_by(OHLCData.date.desc()).limit(90).all()
    
    # Get recent news
    news_items = db.query(NewsItem).filter(
        NewsItem.ticker == ticker.upper()
    ).order_by(NewsItem.published_at.desc()).limit(10).all()
    
    # Get AI insights
    ai_insight = db.query(AIInsight).filter(
        and_(
            AIInsight.scope == "company",
            AIInsight.ref_key == ticker.upper()
        )
    ).order_by(AIInsight.updated_at.desc()).first()
    
    # Calculate price change
    price_change = None
    change_pct = None
    if len(ohlc_data) >= 2:
        current_price = float(ohlc_data[0].close_price)
        previous_price = float(ohlc_data[1].close_price)
        price_change = current_price - previous_price
        change_pct = (price_change / previous_price) * 100 if previous_price != 0 else 0
    
    # Check if user has this in watchlist
    watched = False
    if current_user:
        watchlist_entry = db.query(Watchlist).filter(
            and_(Watchlist.user_id == current_user.id, Watchlist.company_id == company.id)
        ).first()
        watched = watchlist_entry is not None
    
    # Build response
    response_data = {
        "id": company.id,
        "ticker": company.ticker,
        "name": company.name,
        "sector": company.sector,
        "industry": company.industry,
        "market_cap": float(company.market_cap) if company.market_cap else None,
        "price": float(ohlc_data[0].close_price) if ohlc_data else company.last_price,
        "change": price_change,
        "change_pct": change_pct,
        "description": company.description,
        "website": company.website,
        "headquarters": company.headquarters,
        "employees": int(company.employees) if company.employees else None,
        "founded_year": int(company.founded_year) if company.founded_year else None,
        "ratios": company.ratios or {},
        "ohlc": [
            {
                "t": item.date.isoformat(),
                "o": float(item.open_price),
                "h": float(item.high_price),
                "l": float(item.low_price),
                "c": float(item.close_price),
                "v": int(item.volume) if item.volume else 0
            }
            for item in reversed(ohlc_data)  # Reverse to get chronological order
        ],
        "news": [
            {
                "title": item.title,
                "url": item.url,
                "source": item.source,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "summary": item.summary
            }
            for item in news_items
        ],
        "ai": {
            "summary": ai_insight.text if ai_insight else None,
            "confidence": float(ai_insight.confidence) if ai_insight and ai_insight.confidence else None,
            "updated_at": ai_insight.updated_at.isoformat() if ai_insight else None
        },
        "watched": watched
    }
    
    # Cache the response (without watched status) for 2 minutes
    cache_data = {k: v for k, v in response_data.items() if k != "watched"}
    await cache_set(cache_key, cache_data, ttl=120)
    
    return response_data


@router.post("/{ticker}/watch")
async def toggle_watchlist(
    ticker: str,
    action: Dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add or remove company from user's watchlist."""
    
    # Validate action
    if "action" not in action or action["action"] not in ["add", "remove"]:
        raise HTTPException(
            status_code=400, 
            detail="Action must be 'add' or 'remove'"
        )
    
    # Find company
    company = db.query(Company).filter(Company.ticker == ticker.upper()).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check existing watchlist entry
    watchlist_entry = db.query(Watchlist).filter(
        and_(Watchlist.user_id == current_user.id, Watchlist.company_id == company.id)
    ).first()
    
    if action["action"] == "add":
        if watchlist_entry:
            return {"message": "Company already in watchlist", "watched": True}
        
        # Add to watchlist
        new_entry = Watchlist(
            id=generate_id("watchlist"),
            user_id=current_user.id,
            company_id=company.id
        )
        db.add(new_entry)
        db.commit()
        
        return {"message": "Company added to watchlist", "watched": True}
    
    else:  # remove
        if not watchlist_entry:
            return {"message": "Company not in watchlist", "watched": False}
        
        db.delete(watchlist_entry)
        db.commit()
        
        return {"message": "Company removed from watchlist", "watched": False}


@router.get("/watchlist/all")
async def get_watchlist(
    db: Session = Depends(get_db),
    pagination: PaginationParams = Depends(),
    current_user: User = Depends(get_current_user)
):
    """Get user's watchlist with pagination."""
    
    # Query watchlisted companies
    query = db.query(Company).join(
        Watchlist, Company.id == Watchlist.company_id
    ).filter(
        Watchlist.user_id == current_user.id
    ).order_by(Watchlist.created_at.desc())
    
    # Paginate results
    result = paginate_query(query, pagination)
    
    # Add watchlist metadata
    for company in result["items"]:
        company.watched = True  # All items in this list are watched
        
        # Get watchlist entry for additional metadata
        watchlist_entry = db.query(Watchlist).filter(
            and_(Watchlist.user_id == current_user.id, Watchlist.company_id == company.id)
        ).first()
        
        company.added_to_watchlist = watchlist_entry.created_at.isoformat() if watchlist_entry else None
    
    return result


# Background task to refresh company data
async def refresh_company_data(ticker: str):
    """Refresh company data from external APIs (called by workers)."""
    try:
        # This would be called by Celery workers
        # Get fresh data from AlphaVantage
        price_data = await alpha_vantage.get_daily_prices(ticker, outputsize="compact")
        
        # Get company overview
        overview_data = await alpha_vantage.get_company_overview(ticker)
        
        # Get recent news
        news_data = await news_api.get_company_news(ticker)
        
        # Generate AI insight
        if overview_data:
            ai_analysis = await openai_service.generate_company_analysis(
                company_data=overview_data,
                market_data=price_data[:5] if price_data else None
            )
        
        return {
            "ticker": ticker,
            "price_data": price_data,
            "overview": overview_data,
            "news": news_data,
            "ai_analysis": ai_analysis
        }
        
    except Exception as e:
        print(f"Error refreshing data for {ticker}: {e}")
        return None
