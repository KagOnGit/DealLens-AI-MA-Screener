from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json

from ....core.deps import get_db
from ....core.cache import cache_result
from ....models import Filing
# from ....schemas.filings import FilingsResponse, FilingDetail

router = APIRouter()


@router.get("/", )
@cache_result(expire=900)  # Cache for 15 minutes
async def get_filings(
    ticker: Optional[str] = Query(None, description="Filter by ticker symbol"),
    type: Optional[str] = Query(None, description="Filing type: 10-K, 10-Q, 8-K, etc."),
    from_date: Optional[str] = Query(None, description="From date (YYYY-MM-DD)"),
    to_date: Optional[str] = Query(None, description="To date (YYYY-MM-DD)"),
    page: int = Query(1, description="Page number"),
    limit: int = Query(25, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get SEC filings with filters and highlights."""
    try:
        # Mock response for now
        mock_filings = []
        
        filing_types = ["10-K", "10-Q", "8-K", "DEF 14A", "SC 13D", "SC 13G"]
        base_date = datetime.now()
        
        for i in range(1, min(limit + 1, 21)):
            filing_date = base_date - timedelta(days=i * 7)
            filing_type = filing_types[(i - 1) % len(filing_types)]
            
            highlights = [
                f"Revenue increased {5 + i}% year-over-year",
                f"Net income of ${50 + i * 10}M vs ${40 + i * 8}M prior year",
                "Announced new product line expansion",
                "Completed acquisition integration",
                f"Raised guidance for {filing_date.year}"
            ]
            
            mock_filings.append({
                "id": i,
                "ticker": ticker or f"TICK{i:02d}",
                "type": filing_type,
                "filed_at": filing_date.isoformat(),
                "url": f"https://sec.gov/Archives/edgar/data/123456789/{filing_date.strftime('%Y%m%d')}-filing-{i}.htm",
                "title": f"Form {filing_type} - {ticker or f'TICK{i:02d}'} Corporation",
                "highlights": highlights[:3]  # Top 3 highlights
            })
        
        response = {
            "filings": mock_filings,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": 500,
                "pages": 20
            },
            "filters": {
                "ticker": ticker,
                "type": type,
                "from_date": from_date,
                "to_date": to_date
            }
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{filing_id}", )
@cache_result(expire=1800)  # Cache for 30 minutes
async def get_filing_detail(
    filing_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific filing."""
    try:
        # Mock response for now
        filing_date = datetime.now() - timedelta(days=filing_id * 7)
        
        mock_detail = {
            "id": filing_id,
            "ticker": "AAPL",
            "type": "10-Q",
            "filed_at": filing_date.isoformat(),
            "url": f"https://sec.gov/Archives/edgar/data/320193/{filing_date.strftime('%Y%m%d')}-10q-{filing_id}.htm",
            "title": "Form 10-Q - Apple Inc.",
            "highlights": [
                "Revenue of $89.5 billion, up 2% year-over-year",
                "iPhone revenue of $43.8 billion, down 2% year-over-year", 
                "Services revenue of $22.3 billion, up 16% year-over-year",
                "Mac revenue of $7.2 billion, up 25% year-over-year",
                "iPad revenue of $6.4 billion, down 13% year-over-year",
                "Gross margin of 44.1%, up 150 basis points year-over-year",
                "Operating income of $23.1 billion, up 11% year-over-year",
                "Diluted earnings per share of $1.46, up 13% year-over-year",
                "Cash and cash equivalents of $29.9 billion",
                "Returned $24.5 billion to shareholders via dividends and share repurchases"
            ],
            "sections": {
                "business_overview": "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables and accessories worldwide.",
                "risk_factors": [
                    "Global economic conditions and uncertainties",
                    "Competition in markets for Company's products and services",
                    "Dependence on third-party suppliers and manufacturing partners",
                    "Cybersecurity threats and privacy concerns"
                ],
                "financial_performance": {
                    "revenue": 89500,  # millions
                    "gross_profit": 39430,
                    "operating_income": 23100,
                    "net_income": 20721
                }
            },
            "parsed_at": datetime.now().isoformat()
        }
        return mock_detail
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
