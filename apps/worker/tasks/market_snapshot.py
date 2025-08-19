from celery import Task
import yfinance as yf
import redis
import json
from datetime import datetime

from ..celery_app import celery_app

redis_client = redis.Redis(host='localhost', port=6379, db=0)


@celery_app.task(bind=True)
def refresh_market_snapshot(self: Task):
    """Refresh market indices, yields, and FX data in Redis cache."""
    try:
        # Get market data
        indices_data = {}
        
        # Major indices
        for ticker in ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"]:
            try:
                stock = yf.Ticker(ticker)
                info = stock.info
                history = stock.history(period="2d")
                
                if not history.empty:
                    current = history.iloc[-1]
                    previous = history.iloc[-2] if len(history) > 1 else current
                    
                    indices_data[ticker] = {
                        "value": round(current['Close'], 2),
                        "change": round(current['Close'] - previous['Close'], 2),
                        "change_percent": round(((current['Close'] - previous['Close']) / previous['Close']) * 100, 2)
                    }
            except Exception as e:
                print(f"Error fetching {ticker}: {e}")
                continue
        
        # Store in Redis with 10-minute expiration
        market_data = {
            "indices": indices_data,
            "timestamp": datetime.now().isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        
        redis_client.setex("market_snapshot", 600, json.dumps(market_data))
        
        return {"status": "success", "updated": len(indices_data)}
        
    except Exception as e:
        self.retry(countdown=60, max_retries=3)
        return {"status": "error", "message": str(e)}
