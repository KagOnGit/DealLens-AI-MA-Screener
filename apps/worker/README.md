# DealLens Celery Worker System

This is the background job processing system for DealLens, built with Celery and Redis. It handles data synchronization, AI insights generation, alert evaluation, and user notifications.

## System Overview

The worker system consists of several task categories:

### 🔄 Market Data Sync (`sync_market.py`)
- **Real-time price updates** during market hours (every 1 minute)
- **Daily OHLC data** synchronization
- **Company fundamentals** data refresh
- **Data cleanup** tasks to manage storage

### 📰 News Processing (`sync_news.py`)
- **General market news** ingestion (every 15 minutes)
- **Company-specific news** tracking
- **M&A deal news** monitoring
- **Sentiment analysis** using OpenAI
- **News deduplication** to prevent duplicates

### 🤖 AI Insights (`generate_insights.py`)
- **Company analysis** with investment recommendations
- **Deal analysis** for M&A transactions  
- **Market-wide analysis** and daily summaries
- **Cost-optimized** OpenAI API usage with caching

### ⚠️ Alert Processing (`evaluate_alerts.py`)
- **Price alerts** (above/below thresholds, percentage changes)
- **Volume alerts** (spikes, absolute thresholds)
- **News alerts** (mentions, sentiment triggers)
- **Deal alerts** (new deals, status changes)

### 📧 Notifications (`send_notifications.py`)
- **Real-time alert notifications** via email/push
- **Daily digest emails** with watchlist performance
- **Weekly summary reports**
- **Multi-channel delivery** (email, push, SMS ready)

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services including Redis, PostgreSQL, worker, and beat scheduler
docker-compose -f docker-compose.worker.yml up -d

# Monitor logs
docker-compose -f docker-compose.worker.yml logs -f celery_worker
docker-compose -f docker-compose.worker.yml logs -f celery_beat

# View task monitoring with Flower (optional)
open http://localhost:5555
```

### Option 2: Local Development

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Start Redis:**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally (macOS)
brew install redis
redis-server
```

3. **Set environment variables:**
```bash
export REDIS_URL=redis://localhost:6379/0
export DATABASE_URL=postgresql://user:password@localhost/deallens
export ALPHAVANTAGE_API_KEY=your_key_here
export NEWS_API_KEY=your_key_here
export OPENAI_API_KEY=your_key_here
```

4. **Start the worker and scheduler:**
```bash
# Terminal 1: Start worker
./start_worker.sh

# Terminal 2: Start beat scheduler
./start_beat.sh
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `ALPHAVANTAGE_API_KEY` | AlphaVantage API key for market data | Required |
| `NEWS_API_KEY` | NewsAPI key for news feeds | Required |
| `OPENAI_API_KEY` | OpenAI API key for AI insights | Required |
| `CELERY_LOGLEVEL` | Logging level | `info` |
| `CELERY_CONCURRENCY` | Worker concurrency | `2` |

### Task Schedules

The system runs on the following schedule (all times UTC):

**Market Data:**
- Price sync: Every 1 minute during market hours (14:00-21:00 UTC, Mon-Fri)
- Daily OHLC: 22:30 UTC after market close
- Fundamentals: 06:00 UTC before market open

**News & Insights:**
- General news: Every 15 minutes (12:00-23:00 UTC)
- Company news: Every 30 minutes (offset +10 min)
- AI insights: Every 4-8 hours depending on type

**Alerts & Notifications:**
- Price alerts: Every 2 minutes during market hours
- Volume alerts: Every 5 minutes during market hours
- News alerts: Every 5 minutes
- Daily digest: 12:00 UTC (morning in most regions)
- Weekly summary: Sundays at 14:00 UTC

## Task Management

### Manual Task Execution

You can trigger tasks manually using Celery commands:

```bash
# Sync prices for specific companies
celery -A app call tasks.sync_market.sync_company_prices --args='[["AAPL", "GOOGL", "MSFT"]]'

# Generate insights for a company
celery -A app call tasks.generate_insights.generate_company_insights --args='[["company_id_here"]]'

# Send test notification
celery -A app call tasks.send_notifications.send_alert_notification --args='["alert_history_id"]'
```

### Monitoring Tasks

Monitor task execution with Flower:
```bash
celery -A app flower --port=5555
```

Or inspect worker status:
```bash
# Check active workers
celery -A app inspect active

# Check scheduled tasks
celery -A app inspect scheduled

# Check worker stats
celery -A app inspect stats
```

## Database Requirements

The worker system requires these database tables (handled by Alembic migrations):

- **Companies & OHLC data** (`companies`, `ohlc_data`)
- **News articles** (`news_articles`) 
- **AI insights** (`ai_insights`)
- **Alerts & history** (`alerts`, `alert_history`)
- **Users & watchlists** (`users`, `watchlist`)
- **M&A deals** (`deals`)

Run migrations before starting workers:
```bash
cd ../api
alembic upgrade head
```

## API Rate Limits

The system respects API rate limits:

- **AlphaVantage:** 5 calls/minute, 500 calls/day (free tier)
- **NewsAPI:** 1000 requests/day (free tier)  
- **OpenAI:** Configurable rate limiting with cost estimation

## Scaling & Performance

**Single Machine:**
- Worker: 2-4 processes recommended
- Beat: 1 process only (singleton)
- Memory: ~200MB per worker process

**Multi-Machine:**
- Add more worker nodes connecting to same Redis
- Keep beat scheduler on single node only
- Use Redis Cluster for high availability

**Performance Tuning:**
```bash
# Increase concurrency for I/O heavy workloads
export CELERY_CONCURRENCY=4

# Use eventlet for better async performance
pip install eventlet
celery -A app worker --pool=eventlet --concurrency=100
```

## Monitoring & Logging

**Log Locations:**
- Worker logs: Console output (capture with Docker logs)
- Beat logs: Console output
- Task results: Stored in Redis

**Health Checks:**
- Worker: `celery -A app inspect ping`
- Redis: `redis-cli ping`
- Database: Standard PostgreSQL health checks

**Metrics:**
- Task execution times and success rates
- Queue lengths and processing delays
- API call costs and rate limit usage

## Error Handling

The system implements robust error handling:

- **Automatic retries** with exponential backoff
- **Dead letter queues** for failed tasks
- **Graceful degradation** when external APIs are down
- **Data validation** to prevent corruption

## Security Considerations

- **API keys** stored as environment variables
- **Database connections** use connection pooling
- **Worker processes** run as non-root user
- **Redis** access should be secured in production
- **Rate limiting** prevents API abuse

## Production Deployment

For production deployment:

1. **Use Docker Compose** with proper resource limits
2. **Set up monitoring** with Prometheus + Grafana
3. **Configure log aggregation** (ELK stack or similar)
4. **Set up Redis persistence** and backup
5. **Use SSL/TLS** for all connections
6. **Implement proper secrets management**

## Troubleshooting

**Common Issues:**

1. **Worker not starting:** Check Redis connection and database access
2. **Tasks not executing:** Verify beat scheduler is running
3. **API errors:** Check API keys and rate limits
4. **Memory issues:** Reduce concurrency or add more RAM

**Debug Commands:**
```bash
# Check Redis connection
redis-cli ping

# Test database connection
python -c "from tasks.utilities import get_db_session; print('DB OK')"

# Check task queues
celery -A app inspect reserved
```

This system provides a robust, scalable foundation for DealLens's data processing and user notification needs.
