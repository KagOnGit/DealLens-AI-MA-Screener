import asyncio
import httpx
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import pandas as pd
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class AlphaVantageService:
    """Service for interacting with Alpha Vantage API for financial data."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.ALPHA_VANTAGE_API_KEY
        self.base_url = "https://www.alphavantage.co/query"
        self.timeout = httpx.Timeout(30.0)
        
    async def _make_request(self, params: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Make request to Alpha Vantage API with error handling."""
        if not self.api_key:
            logger.error("Alpha Vantage API key not configured")
            return None
            
        params["apikey"] = self.api_key
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Check for API errors
                if "Error Message" in data:
                    logger.error(f"Alpha Vantage API Error: {data['Error Message']}")
                    return None
                    
                if "Information" in data:
                    logger.warning(f"Alpha Vantage API Info: {data['Information']}")
                    # This might be a rate limit message
                    return None
                    
                return data
                
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling Alpha Vantage API: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error calling Alpha Vantage API: {e}")
            return None

    async def get_daily_prices(self, symbol: str, outputsize: str = "compact") -> Optional[List[Dict[str, Any]]]:
        """
        Get daily stock prices for a symbol.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL')
            outputsize: 'compact' (100 days) or 'full' (all available data)
        """
        params = {
            "function": "TIME_SERIES_DAILY_ADJUSTED",
            "symbol": symbol,
            "outputsize": outputsize
        }
        
        data = await self._make_request(params)
        if not data or "Time Series (Daily)" not in data:
            return None
            
        time_series = data["Time Series (Daily)"]
        
        # Convert to list of dictionaries
        prices = []
        for date_str, values in time_series.items():
            prices.append({
                "date": date_str,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "adjusted_close": float(values["5. adjusted close"]),
                "volume": int(values["6. volume"]),
                "dividend_amount": float(values["7. dividend amount"]),
                "split_coefficient": float(values["8. split coefficient"])
            })
            
        # Sort by date (newest first)
        prices.sort(key=lambda x: x["date"], reverse=True)
        return prices

    async def get_intraday_prices(self, symbol: str, interval: str = "5min") -> Optional[List[Dict[str, Any]]]:
        """
        Get intraday stock prices for a symbol.
        
        Args:
            symbol: Stock symbol
            interval: '1min', '5min', '15min', '30min', '60min'
        """
        params = {
            "function": "TIME_SERIES_INTRADAY",
            "symbol": symbol,
            "interval": interval,
            "outputsize": "compact"
        }
        
        data = await self._make_request(params)
        if not data or f"Time Series ({interval})" not in data:
            return None
            
        time_series = data[f"Time Series ({interval})"]
        
        prices = []
        for datetime_str, values in time_series.items():
            prices.append({
                "datetime": datetime_str,
                "open": float(values["1. open"]),
                "high": float(values["2. high"]),
                "low": float(values["3. low"]),
                "close": float(values["4. close"]),
                "volume": int(values["5. volume"])
            })
            
        prices.sort(key=lambda x: x["datetime"], reverse=True)
        return prices

    async def get_company_overview(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get company overview and fundamental data."""
        params = {
            "function": "OVERVIEW",
            "symbol": symbol
        }
        
        data = await self._make_request(params)
        if not data or "Symbol" not in data:
            return None
            
        # Clean and convert numeric fields
        overview = {}
        for key, value in data.items():
            if value == "None" or value == "-":
                overview[key] = None
            elif key in ["MarketCapitalization", "EBITDA", "PERatio", "PEGRatio", 
                        "BookValue", "DividendPerShare", "DividendYield", "EPS",
                        "RevenuePerShareTTM", "ProfitMargin", "OperatingMarginTTM",
                        "ReturnOnAssetsTTM", "ReturnOnEquityTTM", "RevenueTTM",
                        "GrossProfitTTM", "DilutedEPSTTM", "QuarterlyEarningsGrowthYOY",
                        "QuarterlyRevenueGrowthYOY", "AnalystTargetPrice", "TrailingPE",
                        "ForwardPE", "PriceToSalesRatioTTM", "PriceToBookRatio",
                        "EVToRevenue", "EVToEBITDA", "Beta", "52WeekHigh", "52WeekLow",
                        "50DayMovingAverage", "200DayMovingAverage", "SharesOutstanding",
                        "DividendDate", "ExDividendDate"]:
                try:
                    overview[key] = float(value) if value else None
                except (ValueError, TypeError):
                    overview[key] = value
            else:
                overview[key] = value
                
        return overview

    async def get_earnings(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Get quarterly and annual earnings for a symbol."""
        params = {
            "function": "EARNINGS",
            "symbol": symbol
        }
        
        data = await self._make_request(params)
        if not data:
            return None
            
        return data

    async def search_companies(self, keywords: str) -> Optional[List[Dict[str, Any]]]:
        """Search for companies by keywords."""
        params = {
            "function": "SYMBOL_SEARCH",
            "keywords": keywords
        }
        
        data = await self._make_request(params)
        if not data or "bestMatches" not in data:
            return None
            
        matches = []
        for match in data["bestMatches"]:
            matches.append({
                "symbol": match["1. symbol"],
                "name": match["2. name"],
                "type": match["3. type"],
                "region": match["4. region"],
                "market_open": match["5. marketOpen"],
                "market_close": match["6. marketClose"],
                "timezone": match["7. timezone"],
                "currency": match["8. currency"],
                "match_score": float(match["9. matchScore"])
            })
            
        return matches

    async def get_technical_indicators(self, symbol: str, indicator: str, 
                                     interval: str = "daily", **kwargs) -> Optional[Dict[str, Any]]:
        """
        Get technical indicators for a symbol.
        
        Args:
            symbol: Stock symbol
            indicator: Technical indicator (e.g., 'SMA', 'RSI', 'MACD')
            interval: Time interval ('1min', '5min', '15min', '30min', '60min', 'daily', 'weekly', 'monthly')
            **kwargs: Additional parameters specific to the indicator
        """
        params = {
            "function": indicator,
            "symbol": symbol,
            "interval": interval,
            **kwargs
        }
        
        return await self._make_request(params)

    async def get_multiple_symbols_data(self, symbols: List[str]) -> Dict[str, Optional[Dict[str, Any]]]:
        """Get data for multiple symbols with rate limiting."""
        results = {}
        
        for i, symbol in enumerate(symbols):
            if i > 0:
                # Add delay to respect rate limits (5 calls per minute for free tier)
                await asyncio.sleep(12)
                
            results[symbol] = await self.get_company_overview(symbol)
            
        return results
