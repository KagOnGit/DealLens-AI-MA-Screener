import os
from celery import Celery
from celery.schedules import crontab

# Get configuration from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/deallens")

# Initialize Celery app
app = Celery(
    "deallens_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "tasks.sync_market",
        "tasks.sync_news", 
        "tasks.ai_insights",
        "tasks.evaluate_alerts"
    ]
)

# Celery configuration
app.conf.update(
    # Serialization
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    
    # Timezone
    timezone="UTC",
    enable_utc=True,
    
    # Task routing and execution
    task_routes={
        "tasks.sync_market.*": {"queue": "market_data"},
        "tasks.sync_news.*": {"queue": "news"},
        "tasks.ai_insights.*": {"queue": "ai"},
        "tasks.evaluate_alerts.*": {"queue": "alerts"},
    },
    
    # Task result expiration
    result_expires=3600,
    
    # Worker configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
    
    # Beat schedule for periodic tasks
    beat_schedule={
        # Market data sync - every minute during market hours
        "sync-prices-1min": {
            "task": "tasks.sync_market.sync_company_prices",
            "schedule": 60.0,  # Every 60 seconds
            "args": (["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"],),
        },
        
        # News sync - every 10 minutes
        "sync-news-10min": {
            "task": "tasks.sync_news.sync_company_news",
            "schedule": 600.0,  # Every 10 minutes
            "args": (["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"],),
        },
        
        # M&A news sync - every 15 minutes
        "sync-ma-news-15min": {
            "task": "tasks.sync_news.sync_ma_news",
            "schedule": 900.0,  # Every 15 minutes
        },
        
        # Alert evaluation - every minute
        "evaluate-alerts-1min": {
            "task": "tasks.evaluate_alerts.evaluate_all_alerts",
            "schedule": 60.0,  # Every 60 seconds
        },
        
        # AI company insights - daily at 3 AM
        "ai-company-insights-daily": {
            "task": "tasks.ai_insights.generate_daily_company_insights",
            "schedule": crontab(hour=3, minute=0),
        },
        
        # AI deal insights - daily at 4 AM  
        "ai-deal-insights-daily": {
            "task": "tasks.ai_insights.generate_daily_deal_insights",
            "schedule": crontab(hour=4, minute=0),
        },
        
        # AI analytics commentary - daily at 5 AM
        "ai-analytics-daily": {
            "task": "tasks.ai_insights.generate_analytics_commentary",
            "schedule": crontab(hour=5, minute=0),
            "args": ("12M",),
        },
        
        # Extended market data sync - every 30 minutes
        "sync-fundamentals-30min": {
            "task": "tasks.sync_market.sync_company_fundamentals",
            "schedule": 1800.0,  # Every 30 minutes
            "args": (["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "JPM"],),
        },
    },
)

# Task autodiscovery
app.autodiscover_tasks()

if __name__ == "__main__":
    app.start()
