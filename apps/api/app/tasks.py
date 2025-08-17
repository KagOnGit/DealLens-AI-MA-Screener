"""
Celery tasks for fetching and updating data from external sources.
These tasks can be used by the worker to populate the database with real data.
"""
import logging
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from decimal import Decimal
import uuid
import random

try:
    from celery import Celery
except ImportError:
    # Fallback if Celery is not installed
    class MockCelery:
        def __init__(self, *args, **kwargs):
            pass
        
        def task(self, *args, **kwargs):
            def decorator(func):
                return func
            return decorator
        
        @property
        def conf(self):
            return type('obj', (object,), {'update': lambda *a, **k: None, 'task_routes': {}, 'beat_schedule': {}})()
    
    Celery = MockCelery

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.company import Company
from app.models.market_data import MarketData, FinancialMetric, NewsItem

logger = logging.getLogger(__name__)

# Create Celery app
celery_app = Celery(
    "deallens_api",
    broker=settings.CELERY_BROKER_URL or "redis://localhost:6379/0",
    backend=settings.CELERY_RESULT_BACKEND or "redis://localhost:6379/0"
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    result_expires=3600,
)


@celery_app.task(bind=True)
def fetch_company_profile(self, ticker: str):
    """
    Fetch company profile data from external sources and update database.
    This is a basic implementation that would integrate with real data sources.
    """
    logger.info(f"Fetching company profile for {ticker}")
    
    try:
        with SessionLocal() as db:
            # Check if company exists
            company = db.query(Company).filter(
                Company.ticker == ticker.upper()
            ).first()
            
            if not company:
                # Create new company with mock data
                company = Company(
                    id=str(uuid.uuid4()),
                    ticker=ticker.upper(),
                    name=f"{ticker.upper()} Corporation",
                    description=f"Leading company in the {ticker.upper()} sector",
                    sector="Technology",
                    industry="Software",
                    country="United States",
                    market_cap=Decimal("10000.00"),
                    employees=50000,
                    founded_year=2010,
                    website=f"https://{ticker.lower()}.com",
                    headquarters="San Francisco, CA",
                    is_public=True,
                    is_active=True
                )
                db.add(company)
                db.commit()
                logger.info(f"Created new company: {ticker}")
            else:
                # Update existing company data
                company.updated_at = datetime.utcnow()
                db.commit()
                logger.info(f"Updated existing company: {ticker}")
            
            # Invalidate cache for this company
            invalidate_company_cache(ticker)
            
            return {
                "status": "success",
                "ticker": ticker,
                "company_id": company.id,
                "action": "created" if not company else "updated"
            }
            
    except Exception as e:
        logger.error(f"Error fetching company profile for {ticker}: {e}")
        self.retry(countdown=60, max_retries=3)


@celery_app.task(bind=True)
def fetch_market_data(self, ticker: str, days: int = 30):
    """
    Fetch market data (prices, volume) for a company.
    This would integrate with financial data providers like Alpha Vantage.
    """
    logger.info(f"Fetching market data for {ticker} ({days} days)")
    
    try:
        import random
        from datetime import date
        
        with SessionLocal() as db:
            # Find company
            company = db.query(Company).filter(
                Company.ticker == ticker.upper()
            ).first()
            
            if not company:
                logger.error(f"Company {ticker} not found")
                return {"status": "error", "message": f"Company {ticker} not found"}
            
            # Generate mock daily market data
            base_price = random.uniform(50, 500)
            records_added = 0
            
            for i in range(days):
                market_date = date.today() - timedelta(days=i)
                
                # Check if data already exists
                existing = db.query(MarketData).filter(
                    MarketData.company_id == company.id,
                    MarketData.date == market_date
                ).first()
                
                if not existing:
                    # Generate mock price data with some volatility
                    daily_change = random.uniform(-0.05, 0.05)  # ±5% daily change
                    open_price = base_price * (1 + random.uniform(-0.02, 0.02))
                    high_price = open_price * (1 + abs(random.uniform(0, 0.03)))
                    low_price = open_price * (1 - abs(random.uniform(0, 0.03)))
                    close_price = base_price * (1 + daily_change)
                    
                    market_data = MarketData(
                        id=str(uuid.uuid4()),
                        company_id=company.id,
                        date=market_date,
                        open_price=Decimal(str(round(open_price, 2))),
                        high_price=Decimal(str(round(high_price, 2))),
                        low_price=Decimal(str(round(low_price, 2))),
                        close_price=Decimal(str(round(close_price, 2))),
                        adjusted_close=Decimal(str(round(close_price, 2))),
                        volume=random.randint(1000000, 50000000),
                        market_cap=Decimal(str(round(close_price * 1000000000, 2))),
                        data_source="mock",
                        is_adjusted=True
                    )\n                    \n                    db.add(market_data)\n                    records_added += 1\n                    \n                    # Update base price for next iteration\n                    base_price = close_price\n            \n            db.commit()\n            \n            # Invalidate cache\n            invalidate_company_cache(ticker)\n            \n            return {\n                \"status\": \"success\",\n                \"ticker\": ticker,\n                \"records_added\": records_added,\n                \"days_processed\": days\n            }\n            \n    except Exception as e:\n        logger.error(f\"Error fetching market data for {ticker}: {e}\")\n        self.retry(countdown=120, max_retries=3)\n\n\n@celery_app.task(bind=True)\ndef fetch_company_news(self, ticker: str, limit: int = 10):\n    \"\"\"\n    Fetch recent news for a company.\n    This would integrate with news APIs like NewsAPI.\n    \"\"\"\n    logger.info(f\"Fetching news for {ticker} (limit: {limit})\")\n    \n    try:\n        with SessionLocal() as db:\n            # Find company\n            company = db.query(Company).filter(\n                Company.ticker == ticker.upper()\n            ).first()\n            \n            if not company:\n                logger.error(f\"Company {ticker} not found\")\n                return {\"status\": \"error\", \"message\": f\"Company {ticker} not found\"}\n            \n            # Generate mock news items\n            news_templates = [\n                f\"{ticker} Reports Strong Quarterly Earnings\",\n                f\"{ticker} Announces New Product Launch\", \n                f\"Analysts Upgrade {ticker} Stock Rating\",\n                f\"{ticker} CEO Discusses Future Strategy\",\n                f\"{ticker} Expands Into New Markets\",\n                f\"Regulatory Update Impacts {ticker}\"\n            ]\n            \n            records_added = 0\n            \n            for i in range(min(limit, len(news_templates))):\n                # Check if similar news already exists\n                headline = news_templates[i]\n                existing = db.query(NewsItem).filter(\n                    NewsItem.company_id == company.id,\n                    NewsItem.title.contains(headline[:20])\n                ).first()\n                \n                if not existing:\n                    import random\n                    \n                    news_item = NewsItem(\n                        id=str(uuid.uuid4()),\n                        company_id=company.id,\n                        title=headline,\n                        summary=f\"Company update regarding {ticker} business operations and market performance.\",\n                        url=f\"https://news.example.com/{ticker.lower()}-{i}\",\n                        source=random.choice([\"Reuters\", \"Bloomberg\", \"CNBC\", \"Wall Street Journal\"]),\n                        published_at=datetime.utcnow() - timedelta(hours=random.randint(1, 48)),\n                        category=\"Corporate\",\n                        sentiment_score=Decimal(str(random.uniform(-0.5, 0.5))),\n                        sentiment_label=random.choice([\"positive\", \"neutral\", \"negative\"]),\n                        relevance_score=Decimal(str(random.uniform(0.7, 1.0))),\n                        is_duplicate=False\n                    )\n                    \n                    db.add(news_item)\n                    records_added += 1\n            \n            db.commit()\n            \n            # Invalidate cache\n            invalidate_company_cache(ticker)\n            \n            return {\n                \"status\": \"success\",\n                \"ticker\": ticker,\n                \"records_added\": records_added\n            }\n            \n    except Exception as e:\n        logger.error(f\"Error fetching news for {ticker}: {e}\")\n        self.retry(countdown=60, max_retries=3)\n\n\n@celery_app.task(bind=True)\ndef populate_sample_companies(self):\n    \"\"\"\n    Populate database with sample companies for development/testing.\n    \"\"\"\n    logger.info(\"Populating sample companies\")\n    \n    sample_companies = [\n        {\"ticker\": \"AAPL\", \"name\": \"Apple Inc.\", \"sector\": \"Technology\", \"industry\": \"Consumer Electronics\"},\n        {\"ticker\": \"MSFT\", \"name\": \"Microsoft Corporation\", \"sector\": \"Technology\", \"industry\": \"Software\"},\n        {\"ticker\": \"GOOGL\", \"name\": \"Alphabet Inc.\", \"sector\": \"Technology\", \"industry\": \"Internet Software & Services\"},\n        {\"ticker\": \"AMZN\", \"name\": \"Amazon.com Inc.\", \"sector\": \"Consumer Discretionary\", \"industry\": \"E-commerce\"},\n        {\"ticker\": \"TSLA\", \"name\": \"Tesla Inc.\", \"sector\": \"Consumer Discretionary\", \"industry\": \"Electric Vehicles\"},\n        {\"ticker\": \"META\", \"name\": \"Meta Platforms Inc.\", \"sector\": \"Communication Services\", \"industry\": \"Social Media\"},\n        {\"ticker\": \"NVDA\", \"name\": \"NVIDIA Corporation\", \"sector\": \"Technology\", \"industry\": \"Semiconductors\"}\n    ]\n    \n    try:\n        with SessionLocal() as db:\n            companies_added = 0\n            \n            for company_data in sample_companies:\n                # Check if company exists\n                existing = db.query(Company).filter(\n                    Company.ticker == company_data[\"ticker\"]\n                ).first()\n                \n                if not existing:\n                    company = Company(\n                        id=str(uuid.uuid4()),\n                        ticker=company_data[\"ticker\"],\n                        name=company_data[\"name\"],\n                        description=f\"{company_data['name']} is a leading company in the {company_data['industry']} industry.\",\n                        sector=company_data[\"sector\"],\n                        industry=company_data[\"industry\"],\n                        country=\"United States\",\n                        market_cap=Decimal(str(random.uniform(100000, 3000000))),\n                        employees=random.randint(10000, 200000),\n                        founded_year=random.randint(1970, 2010),\n                        website=f\"https://{company_data['ticker'].lower()}.com\",\n                        headquarters=random.choice([\"San Francisco, CA\", \"Seattle, WA\", \"Cupertino, CA\", \"Redmond, WA\"]),\n                        is_public=True,\n                        is_active=True\n                    )\n                    \n                    db.add(company)\n                    companies_added += 1\n                    \n                    # Also fetch market data and news for this company\n                    fetch_market_data.delay(company_data[\"ticker\"], 30)\n                    fetch_company_news.delay(company_data[\"ticker\"], 5)\n            \n            db.commit()\n            \n            return {\n                \"status\": \"success\",\n                \"companies_added\": companies_added,\n                \"total_processed\": len(sample_companies)\n            }\n            \n    except Exception as e:\n        logger.error(f\"Error populating sample companies: {e}\")\n        self.retry(countdown=60, max_retries=2)\n\n\n# Periodic tasks configuration\n@celery_app.task\ndef update_market_data_daily():\n    \"\"\"Daily task to update market data for all active companies\"\"\"\n    logger.info(\"Running daily market data update\")\n    \n    try:\n        with SessionLocal() as db:\n            active_companies = db.query(Company).filter(\n                Company.is_active == True,\n                Company.is_public == True\n            ).all()\n            \n            for company in active_companies:\n                if company.ticker:\n                    # Queue market data fetch for each company\n                    fetch_market_data.delay(company.ticker, 1)  # Just today's data\n            \n            logger.info(f\"Queued market data updates for {len(active_companies)} companies\")\n            return {\"status\": \"success\", \"companies_queued\": len(active_companies)}\n            \n    except Exception as e:\n        logger.error(f\"Error in daily market data update: {e}\")\n        return {\"status\": \"error\", \"message\": str(e)}\n\n\n# Task routing and monitoring\ncelery_app.conf.task_routes = {\n    'app.tasks.fetch_company_profile': {'queue': 'company_data'},\n    'app.tasks.fetch_market_data': {'queue': 'market_data'},\n    'app.tasks.fetch_company_news': {'queue': 'news'},\n    'app.tasks.update_market_data_daily': {'queue': 'scheduled'},\n}\n\n# Beat schedule for periodic tasks\ncelery_app.conf.beat_schedule = {\n    'update-market-data': {\n        'task': 'app.tasks.update_market_data_daily',\n        'schedule': 3600.0,  # Run every hour during market hours\n        'options': {'queue': 'scheduled'}\n    },\n}
