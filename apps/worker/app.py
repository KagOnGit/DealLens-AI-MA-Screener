from celery import Celery
from celery.schedules import crontab
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

logger = logging.getLogger(__name__)

# Default Redis configuration
REDIS_HOST = os.environ.get('REDIS_HOST', 'localhost')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
REDIS_DB = os.environ.get('REDIS_DB', '0')
REDIS_URL = os.environ.get('REDIS_URL', f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}')

# Create Celery app
app = Celery(
    'deallens',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        'tasks.sync_market',
        'tasks.sync_news',
        'tasks.generate_insights',
        'tasks.evaluate_alerts',
        'tasks.send_notifications',
    ]
)

# Configure Celery
app.conf.update(
    result_expires=3600,  # Results expire after 1 hour
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=1,  # Prefetch only one task at a time
    task_acks_late=True,  # Acknowledge tasks after execution
    task_reject_on_worker_lost=True,  # Reject task if worker dies during execution
    task_default_rate_limit='20/m',  # Default rate limit
)

# Scheduled tasks
app.conf.beat_schedule = {
    # Market data sync tasks
    'sync-market-prices-market-hours': {
        'task': 'tasks.sync_market.sync_company_prices',
        'schedule': crontab(minute='*/1', hour='14-21', day_of_week='1-5'),  # Every minute during market hours (ET)
        'args': [None],  # All companies
        'options': {'expires': 50}  # Task expires after 50 seconds
    },
    'sync-daily-ohlc': {
        'task': 'tasks.sync_market.sync_daily_ohlc',
        'schedule': crontab(minute='30', hour='22', day_of_week='1-5'),  # 10:30 PM ET after market close
        'args': [None, 5]  # All companies, last 5 days
    },
    'sync-company-fundamentals': {
        'task': 'tasks.sync_market.sync_company_fundamentals',
        'schedule': crontab(minute='0', hour='6', day_of_week='1-5'),  # 6 AM UTC, before market open
        'args': [None]  # All companies
    },
    'cleanup-old-ohlc-data': {
        'task': 'tasks.sync_market.cleanup_old_ohlc_data',
        'schedule': crontab(minute='0', hour='1', day_of_week='1'),  # 1 AM UTC on Mondays
        'args': [365]  # Keep one year of data
    },
    
    # News sync tasks
    'sync-general-market-news': {
        'task': 'tasks.sync_news.sync_general_market_news',
        'schedule': crontab(minute='*/15', hour='12-23'),  # Every 15 minutes during active hours
        'args': [['business', 'technology', 'finance']]
    },
    'sync-company-news': {
        'task': 'tasks.sync_news.sync_company_news',
        'schedule': crontab(minute='10,40', hour='*'),  # Every 30 minutes, offset by 10 minutes
        'args': [None, 7]  # All companies, last 7 days
    },
    'sync-ma-deal-news': {
        'task': 'tasks.sync_news.sync_ma_deal_news',
        'schedule': crontab(minute='25,55', hour='*'),  # Every 30 minutes, offset by 25 minutes
        'args': [None, 14]  # Default keywords, last 14 days
    },
    'analyze-news-sentiment': {
        'task': 'tasks.sync_news.analyze_news_sentiment',
        'schedule': crontab(minute='5,35', hour='*'),  # Every 30 minutes, offset by 5 minutes
        'args': [None, 20]  # Unanalyzed articles, batch size 20
    },
    'cleanup-old-news': {
        'task': 'tasks.sync_news.cleanup_old_news',
        'schedule': crontab(minute='15', hour='2', day_of_week='1'),  # 2:15 AM UTC on Mondays
        'args': [30]  # Keep 30 days of news
    },
    
    # AI insights generation tasks
    'generate-company-insights': {
        'task': 'tasks.generate_insights.generate_company_insights',
        'schedule': crontab(minute='0', hour='*/4'),  # Every 4 hours
        'args': [None, 5]  # Eligible companies, batch size 5
    },
    'generate-deal-insights': {
        'task': 'tasks.generate_insights.generate_deal_insights',
        'schedule': crontab(minute='30', hour='*/8'),  # Every 8 hours, offset by 30 minutes
        'args': [None, 3]  # Eligible deals, batch size 3
    },
    'generate-daily-market-analysis': {
        'task': 'tasks.generate_insights.generate_market_analysis',
        'schedule': crontab(minute='45', hour='22'),  # 10:45 PM UTC daily
        'args': ['daily_summary']
    },
    'cleanup-old-insights': {
        'task': 'tasks.generate_insights.cleanup_old_insights',
        'schedule': crontab(minute='30', hour='3', day_of_week='1'),  # 3:30 AM UTC on Mondays
        'args': [90]  # Keep 90 days of insights
    },
    
    # Alert evaluation tasks
    'evaluate-price-alerts': {
        'task': 'tasks.evaluate_alerts.evaluate_price_alerts',
        'schedule': crontab(minute='*/2', hour='14-21', day_of_week='1-5'),  # Every 2 minutes during market hours
        'args': [None, 100]  # All active alerts, batch size 100
    },
    'evaluate-volume-alerts': {
        'task': 'tasks.evaluate_alerts.evaluate_volume_alerts',
        'schedule': crontab(minute='*/5', hour='14-21', day_of_week='1-5'),  # Every 5 minutes during market hours
        'args': [None, 100]  # All active alerts, batch size 100
    },
    'evaluate-news-alerts': {
        'task': 'tasks.evaluate_alerts.evaluate_news_alerts',
        'schedule': crontab(minute='*/5', hour='*'),  # Every 5 minutes
        'args': [None, 50]  # All active alerts, batch size 50
    },
    'evaluate-deal-alerts': {
        'task': 'tasks.evaluate_alerts.evaluate_deal_alerts',
        'schedule': crontab(minute='*/10', hour='*'),  # Every 10 minutes
        'args': [None, 50]  # All active alerts, batch size 50
    },
    'cleanup-old-alert-history': {
        'task': 'tasks.evaluate_alerts.cleanup_old_alert_history',
        'schedule': crontab(minute='45', hour='3', day_of_week='1'),  # 3:45 AM UTC on Mondays
        'args': [90]  # Keep 90 days of alert history
    },
    'cleanup-expired-alerts': {
        'task': 'tasks.evaluate_alerts.cleanup_expired_alerts',
        'schedule': crontab(minute='0', hour='0'),  # Midnight UTC daily
        'args': []
    },
    
    # Notification tasks
    'send-daily-digest': {
        'task': 'tasks.send_notifications.send_daily_digest',
        'schedule': crontab(minute='0', hour='12'),  # 12 PM UTC (morning in most regions)
        'args': [None]  # All active users
    },
    'send-weekly-summary': {
        'task': 'tasks.send_notifications.send_weekly_summary',
        'schedule': crontab(minute='0', hour='14', day_of_week='0'),  # 2 PM UTC on Sundays
        'args': [None]  # All active users
    },
    'cleanup-notification-logs': {
        'task': 'tasks.send_notifications.cleanup_notification_logs',
        'schedule': crontab(minute='0', hour='4', day_of_week='1'),  # 4 AM UTC on Mondays
        'args': [30]  # Keep 30 days of logs
    },
}

if __name__ == '__main__':
    logger.info("Starting Celery worker...")
    app.start()
