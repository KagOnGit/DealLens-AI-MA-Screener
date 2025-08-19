from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import Optional, List
from datetime import datetime, timedelta, date
import logging
import uuid

from app.core.database import get_db
from app.models.company import Company
from app.models.market_data import MarketData, FinancialMetric, NewsItem
from app.models.ownership import InstitutionalOwnership, InsiderTransaction
# from app.schemas.responses import (
    CompanyDetail,
    CompanyTimeseries,
    CompanyOwnership,
    CompanyNews,
    TimeseriesPoint,
    MarginPoint,
    MultiplePoint,
    OwnershipSlice,
    TopHolder,
    InsiderActivity
)
from app.utils.cache import (
    CacheKeyBuilder,
    cache_manager,
    get_cached_company_detail,
    cache_company_detail,
    invalidate_company_cache
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["companies"])


def _get_company_by_ticker(db: Session, ticker: str) -> Optional[Company]:
    """Get company by ticker with case-insensitive lookup"""
    return db.query(Company).filter(
        func.upper(Company.ticker) == ticker.upper()
    ).first()


def _generate_mock_price_data() -> dict:
    """Generate mock current price data for companies"""
    import random
    base_price = random.uniform(50, 500)
    change = random.uniform(-10, 10)
    return {
        "price": round(base_price, 2),
        "change": round(change, 2),
        "change_percent": round((change / base_price) * 100, 2),
        "volume": random.randint(100000, 50000000)
    }


def _generate_mock_timeseries_data() -> dict:
    """Generate mock timeseries data for companies"""
    import random
    from datetime import datetime, timedelta
    
    # Generate quarterly data for last 4 years
    quarters = 16
    data = []
    
    for i in range(quarters):
        quarter_date = datetime.now() - timedelta(days=i * 90)
        date_str = quarter_date.strftime('%Y-%m-%d')
        
        revenue = random.uniform(1000, 50000)  # millions
        ebitda = revenue * random.uniform(0.15, 0.35)
        fcf = ebitda * random.uniform(0.6, 0.9)
        
        data.append({
            'date': date_str,
            'revenue': round(revenue, 2),
            'ebitda': round(ebitda, 2),
            'fcf': round(fcf, 2),
            'gross_margin': round(random.uniform(40, 80), 1),
            'ebitda_margin': round(random.uniform(15, 35), 1),
            'net_margin': round(random.uniform(10, 25), 1),
            'pe': round(random.uniform(15, 40), 1),
            'ev_ebitda': round(random.uniform(8, 25), 1)
        })
    
    # Reverse to get chronological order
    data.reverse()
    
    return {
        "revenue": [TimeseriesPoint(date=d['date'], value=d['revenue']) for d in data],
        "ebitda": [TimeseriesPoint(date=d['date'], value=d['ebitda']) for d in data],
        "fcf": [TimeseriesPoint(date=d['date'], value=d['fcf']) for d in data],
        "margins": [MarginPoint(
            date=d['date'],
            gross=d['gross_margin'],
            ebitda=d['ebitda_margin'],
            net=d['net_margin']
        ) for d in data],
        "multiples": [MultiplePoint(
            date=d['date'],
            pe=d['pe'],
            ev_ebitda=d['ev_ebitda']
        ) for d in data]
    }


def _generate_mock_ownership_data() -> dict:
    """Generate mock ownership data"""
    import random
    
    # Mock ownership slices
    institutional = round(random.uniform(50, 75), 1)
    retail = round(100 - institutional - random.uniform(5, 20), 1)
    insider = round(100 - institutional - retail, 1)
    
    slices = [
        OwnershipSlice(label="Institutional", value=institutional, color="#3B82F6"),
        OwnershipSlice(label="Retail", value=retail, color="#10B981"),
        OwnershipSlice(label="Insiders", value=insider, color="#F59E0B")
    ]
    
    # Mock top holders
    holders = [
        TopHolder(
            name="Vanguard Group Inc",
            percentage=round(random.uniform(6, 10), 1),
            shares=random.randint(50000000, 200000000)
        ),
        TopHolder(
            name="BlackRock Inc",
            percentage=round(random.uniform(5, 8), 1),
            shares=random.randint(40000000, 150000000)
        ),
        TopHolder(
            name="State Street Corp",
            percentage=round(random.uniform(3, 6), 1),
            shares=random.randint(30000000, 100000000)
        )
    ]
    
    # Mock insider activity
    activity = [
        InsiderActivity(
            date=(datetime.now() - timedelta(days=random.randint(1, 30))).isoformat()[:10],
            type=random.choice(["buy", "sell"]),
            shares=random.randint(1000, 100000),
            value=random.randint(100000, 10000000),
            person="John Doe (CEO)"
        )
        for _ in range(3)
    ]
    
    return {
        "slices": [s.dict() for s in slices],
        "top_holders": [h.dict() for h in holders],
        "insider_activity": [a.dict() for a in activity]
    }


def _generate_mock_news_data(ticker: str) -> List[dict]:
    """Generate mock news data"""
    import random
    
    news_items = [
        {
            "id": str(uuid.uuid4()),
            "headline": f"{ticker} Reports Strong Quarterly Results",
            "source": "Reuters",
            "published_at": (datetime.now() - timedelta(hours=random.randint(1, 48))).isoformat(),
            "url": f"https://reuters.com/{ticker.lower()}-earnings",
            "summary": "Company exceeds analyst expectations with strong revenue growth",
            "relevance_score": 0.95,
            "sentiment": "positive"
        },
        {
            "id": str(uuid.uuid4()),
            "headline": f"Analysts Upgrade {ticker} Stock Rating",
            "source": "Bloomberg",
            "published_at": (datetime.now() - timedelta(hours=random.randint(12, 72))).isoformat(),
            "url": f"https://bloomberg.com/{ticker.lower()}-upgrade",
            "summary": "Multiple analysts raise price targets following strong performance",
            "relevance_score": 0.88,
            "sentiment": "positive"
        },
        {
            "id": str(uuid.uuid4()),
            "headline": f"{ticker} Faces Regulatory Scrutiny",
            "source": "Wall Street Journal",
            "published_at": (datetime.now() - timedelta(hours=random.randint(24, 96))).isoformat(),
            "url": f"https://wsj.com/{ticker.lower()}-regulatory",
            "summary": "Regulatory concerns may impact future operations",
            "relevance_score": 0.82,
            "sentiment": "negative"
        }
    ]
    
    return news_items[:random.randint(1, 3)]  # Return 1-3 news items


@router.get("/companies/{ticker}", )
async def get_company_detail(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Get detailed company information by ticker"""
    ticker = ticker.upper()
    logger.info(f"Getting company detail for {ticker}")
    
    # Try cache first
    cache_key = CacheKeyBuilder.company_detail(ticker)
    cached_data = cache_manager.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for company detail: {ticker}")
        return cached_data
    
    # Get company from database
    company = _get_company_by_ticker(db, ticker)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")
    
    # Get latest market data for price info
    latest_market_data = db.query(MarketData).filter(
        MarketData.company_id == company.id
    ).order_by(desc(MarketData.date)).first()
    
    # Generate mock price data if not available
    price_data = _generate_mock_price_data()
    
    # Build response
    detail = {
        "ticker": company.ticker or ticker,
        "name": company.name,
        "sector": company.sector or "Technology",
        "industry": company.industry or "Software",
        "market_cap": float(company.market_cap) if company.market_cap else 10000.0,
        "price": price_data["price"],
        "change": price_data["change"],
        "change_percent": price_data["change_percent"],
        "volume": price_data["volume"],
        "pe_ratio": 25.5,
        "ev_ebitda": 18.2,
        "revenue": 15000.0,
        "employees": company.employees or 50000,
        "headquarters": company.headquarters or "San Francisco, CA",
        "founded": company.founded_year or 2010,
        "description": company.description or "Leading technology company",
        "website": company.website or "https://example.com",
        "beta": 1.12,
        "currency": "USD",
        "updated_at": datetime.now().isoformat(),
        "business_summary": f"{company.name} is a leading company in the {company.industry or 'technology'} sector.",
        "key_risks": [
            "Market competition",
            "Regulatory changes",
            "Economic downturns"
        ],
        "competitive_moats": [
            "Strong brand recognition",
            "Network effects",
            "Proprietary technology"
        ]
    }
    
    # Cache the result
    cache_manager.set(cache_key, detail, 300)  # 5 minutes
    
    return detail


@router.get("/companies/{ticker}/timeseries", )
async def get_company_timeseries(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Get company financial timeseries data"""
    ticker = ticker.upper()
    logger.info(f"Getting timeseries data for {ticker}")
    
    # Try cache first
    cache_key = CacheKeyBuilder.company_timeseries(ticker)
    cached_data = cache_manager.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for timeseries: {ticker}")
        return cached_data
    
    # Check if company exists
    company = _get_company_by_ticker(db, ticker)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")
    
    # Generate mock timeseries data
    timeseries_data = _generate_mock_timeseries_data()
    
    # Cache the result
    cache_manager.set(cache_key, timeseries_data, 600)  # 10 minutes
    
    return timeseries_data


@router.get("/companies/{ticker}/ownership", )
async def get_company_ownership(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Get company ownership data"""
    ticker = ticker.upper()
    logger.info(f"Getting ownership data for {ticker}")
    
    # Try cache first
    cache_key = CacheKeyBuilder.company_ownership(ticker)
    cached_data = cache_manager.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for ownership: {ticker}")
        return cached_data
    
    # Check if company exists
    company = _get_company_by_ticker(db, ticker)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")
    
    # Generate mock ownership data
    ownership_data = _generate_mock_ownership_data()
    
    # Cache the result
    cache_manager.set(cache_key, ownership_data, 1800)  # 30 minutes
    
    return ownership_data


@router.get("/companies/{ticker}/news", )
async def get_company_news(
    ticker: str,
    db: Session = Depends(get_db)
):
    """Get recent news for company"""
    ticker = ticker.upper()
    logger.info(f"Getting news for {ticker}")
    
    # Try cache first
    cache_key = CacheKeyBuilder.company_news(ticker)
    cached_data = cache_manager.get(cache_key)
    if cached_data:
        logger.debug(f"Cache hit for news: {ticker}")
        return cached_data
    
    # Check if company exists
    company = _get_company_by_ticker(db, ticker)
    if not company:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found")
    
    # Generate mock news data
    news_data = _generate_mock_news_data(ticker)
    
    # Cache the result
    cache_manager.set(cache_key, news_data, 120)  # 2 minutes
    
    return news_data
