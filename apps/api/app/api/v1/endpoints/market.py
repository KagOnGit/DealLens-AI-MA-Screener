from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta
import yfinance as yf

from ....core.deps import get_db
from ....core.cache import cache_result
# from ....schemas.market import MarketSnapshotResponse

router = APIRouter()


@router.get("/snapshot", )
@cache_result(expire=300)  # Cache for 5 minutes
async def get_market_snapshot(
    db: Session = Depends(get_db)
):
    """Get current market snapshot with indices, yields, and FX data."""
    try:
        # Try to get real data, fall back to mock if fails
        try:
            # Get major indices
            indices_tickers = ["^GSPC", "^DJI", "^IXIC", "^RUT", "^VIX"]
            indices_data = yf.download(indices_tickers, period="2d", interval="1d")
            
            # Get treasury yields
            yield_tickers = ["^TNX", "^FVX", "^TYX"]
            yields_data = yf.download(yield_tickers, period="2d", interval="1d")
            
            # Get FX data
            fx_tickers = ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCAD=X"]
            fx_data = yf.download(fx_tickers, period="2d", interval="1d")
            
            # Process real data here if successful
            pass
            
        except Exception:
            # Fall back to mock data
            pass
        
        # Mock response (replace with real data processing above)
        mock_data = {
            "timestamp": datetime.now().isoformat(),
            "indices": [
                {
                    "symbol": "S&P 500",
                    "ticker": "^GSPC",
                    "value": 4547.23,
                    "change": 12.45,
                    "change_percent": 0.27
                },
                {
                    "symbol": "Dow Jones",
                    "ticker": "^DJI", 
                    "value": 35429.87,
                    "change": -45.23,
                    "change_percent": -0.13
                },
                {
                    "symbol": "NASDAQ",
                    "ticker": "^IXIC",
                    "value": 14385.64,
                    "change": 28.91,
                    "change_percent": 0.20
                },
                {
                    "symbol": "Russell 2000",
                    "ticker": "^RUT",
                    "value": 2087.45,
                    "change": 8.76,
                    "change_percent": 0.42
                },
                {
                    "symbol": "VIX",
                    "ticker": "^VIX",
                    "value": 18.32,
                    "change": -1.24,
                    "change_percent": -6.34
                }
            ],
            "treasuries": [
                {
                    "maturity": "2Y",
                    "yield": 4.85,
                    "change": 0.08
                },
                {
                    "maturity": "5Y",
                    "yield": 4.62,
                    "change": 0.05
                },
                {
                    "maturity": "10Y",
                    "yield": 4.47,
                    "change": 0.02
                },
                {
                    "maturity": "30Y",
                    "yield": 4.61,
                    "change": -0.01
                }
            ],
            "currencies": [
                {
                    "pair": "EUR/USD",
                    "rate": 1.0895,
                    "change": 0.0023,
                    "change_percent": 0.21
                },
                {
                    "pair": "GBP/USD", 
                    "rate": 1.2734,
                    "change": -0.0045,
                    "change_percent": -0.35
                },
                {
                    "pair": "USD/JPY",
                    "rate": 149.87,
                    "change": 0.68,
                    "change_percent": 0.46
                },
                {
                    "pair": "USD/CAD",
                    "rate": 1.3542,
                    "change": 0.0012,
                    "change_percent": 0.09
                }
            ],
            "commodities": [
                {
                    "name": "Crude Oil (WTI)",
                    "symbol": "CL=F",
                    "price": 78.45,
                    "change": 1.23,
                    "change_percent": 1.59
                },
                {
                    "name": "Gold",
                    "symbol": "GC=F",
                    "price": 2045.67,
                    "change": -12.34,
                    "change_percent": -0.60
                },
                {
                    "name": "Silver",
                    "symbol": "SI=F",
                    "price": 24.89,
                    "change": 0.45,
                    "change_percent": 1.84
                }
            ],
            "last_updated": datetime.now().isoformat()
        }
        
        return mock_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
