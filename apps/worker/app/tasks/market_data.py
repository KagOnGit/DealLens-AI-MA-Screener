import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging

from ..celery_app import celery_app
from ..core.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def fetch_daily_prices(self, tickers: List[str] = None):
    """
    Fetch daily price data for companies.
    """
    try:
        if not tickers:
            # Default list of major tickers
            tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "JPM", "JNJ", "V"]
        
        logger.info(f"Fetching market data for {len(tickers)} tickers")
        
        results = {}
        failed_tickers = []
        
        for ticker in tickers:
            try:
                # Fetch last 5 days of data
                stock = yf.Ticker(ticker)
                hist = stock.history(period="5d")
                
                if not hist.empty:
                    latest = hist.iloc[-1]
                    results[ticker] = {
                        "ticker": ticker,
                        "date": hist.index[-1].strftime("%Y-%m-%d"),
                        "open": float(latest["Open"]),
                        "high": float(latest["High"]),
                        "low": float(latest["Low"]),
                        "close": float(latest["Close"]),
                        "volume": int(latest["Volume"]),
                        "adjusted_close": float(latest["Close"])
                    }
                else:
                    failed_tickers.append(ticker)
                    
            except Exception as e:
                logger.warning(f"Failed to fetch data for {ticker}: {str(e)}")
                failed_tickers.append(ticker)
        
        # TODO: Store results in database
        logger.info(f"Successfully fetched data for {len(results)} tickers")
        if failed_tickers:
            logger.warning(f"Failed to fetch data for: {failed_tickers}")
        
        return {
            "success": True,
            "fetched_count": len(results),
            "failed_count": len(failed_tickers),
            "failed_tickers": failed_tickers
        }
        
    except Exception as e:
        logger.error(f"Error in fetch_daily_prices: {str(e)}")
        raise self.retry(countdown=60, exc=e)


@celery_app.task(bind=True, max_retries=3)
def fetch_company_info(self, ticker: str):
    """
    Fetch detailed company information.
    """
    try:
        logger.info(f"Fetching company info for {ticker}")
        
        stock = yf.Ticker(ticker)
        info = stock.info
        
        company_data = {
            "ticker": ticker,
            "name": info.get("longName", ""),
            "sector": info.get("sector", ""),
            "industry": info.get("industry", ""),
            "market_cap": info.get("marketCap"),
            "employees": info.get("fullTimeEmployees"),
            "website": info.get("website", ""),
            "headquarters": f"{info.get('city', '')}, {info.get('state', '')}, {info.get('country', '')}".strip(", "),
            "description": info.get("longBusinessSummary", "")
        }
        
        # TODO: Store in database
        logger.info(f"Successfully fetched info for {ticker}")
        
        return {
            "success": True,
            "ticker": ticker,
            "data": company_data
        }
        
    except Exception as e:
        logger.error(f"Error fetching company info for {ticker}: {str(e)}")
        raise self.retry(countdown=60, exc=e)


@celery_app.task(bind=True, max_retries=3)
def fetch_financial_data(self, ticker: str):
    """
    Fetch financial statements data.
    """
    try:
        logger.info(f"Fetching financial data for {ticker}")
        
        stock = yf.Ticker(ticker)
        
        # Get financial statements
        financials = stock.financials
        balance_sheet = stock.balance_sheet
        cashflow = stock.cashflow
        
        results = {}
        
        if not financials.empty:
            # Get latest annual data
            latest_col = financials.columns[0]
            
            results["income_statement"] = {
                "period": latest_col.strftime("%Y"),
                "revenue": financials.loc["Total Revenue", latest_col] if "Total Revenue" in financials.index else None,
                "gross_profit": financials.loc["Gross Profit", latest_col] if "Gross Profit" in financials.index else None,
                "operating_income": financials.loc["Operating Income", latest_col] if "Operating Income" in financials.index else None,
                "net_income": financials.loc["Net Income", latest_col] if "Net Income" in financials.index else None,
            }
        
        if not balance_sheet.empty:
            latest_col = balance_sheet.columns[0]
            
            results["balance_sheet"] = {
                "period": latest_col.strftime("%Y"),
                "total_assets": balance_sheet.loc["Total Assets", latest_col] if "Total Assets" in balance_sheet.index else None,
                "total_debt": balance_sheet.loc["Total Debt", latest_col] if "Total Debt" in balance_sheet.index else None,
                "cash": balance_sheet.loc["Cash And Cash Equivalents", latest_col] if "Cash And Cash Equivalents" in balance_sheet.index else None,
            }
        
        if not cashflow.empty:
            latest_col = cashflow.columns[0]
            
            results["cash_flow"] = {
                "period": latest_col.strftime("%Y"),
                "operating_cash_flow": cashflow.loc["Operating Cash Flow", latest_col] if "Operating Cash Flow" in cashflow.index else None,
                "free_cash_flow": cashflow.loc["Free Cash Flow", latest_col] if "Free Cash Flow" in cashflow.index else None,
            }
        
        # TODO: Store in database
        logger.info(f"Successfully fetched financial data for {ticker}")
        
        return {
            "success": True,
            "ticker": ticker,
            "data": results
        }
        
    except Exception as e:
        logger.error(f"Error fetching financial data for {ticker}: {str(e)}")
        raise self.retry(countdown=60, exc=e)
