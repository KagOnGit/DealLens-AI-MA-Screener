from celery import Celery
from .core.config import settings

# Create Celery instance
celery_app = Celery(
    "deallens_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.data_scraping",
        "app.tasks.market_data",
        "app.tasks.deal_analysis",
        "app.tasks.alerts"
    ]
)

# Celery configuration
celery_app.conf.update(
    timezone="UTC",
    enable_utc=True,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    result_expires=3600,
    task_always_eager=False,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_compression='gzip',
    result_compression='gzip',
)

# Periodic tasks configuration
celery_app.conf.beat_schedule = {
    'fetch-market-data': {
        'task': 'app.tasks.market_data.fetch_daily_prices',
        'schedule': 60.0 * 60 * 6,  # Every 6 hours
    },
    'scan-for-deals': {
        'task': 'app.tasks.data_scraping.scan_news_for_deals',
        'schedule': 60.0 * 30,  # Every 30 minutes
    },
    'update-financial-metrics': {
        'task': 'app.tasks.data_scraping.update_company_financials',
        'schedule': 60.0 * 60 * 24,  # Daily
    },
    'check-alerts': {
        'task': 'app.tasks.alerts.process_price_alerts',
        'schedule': 60.0 * 5,  # Every 5 minutes
    },
}

if __name__ == "__main__":
    celery_app.start()
