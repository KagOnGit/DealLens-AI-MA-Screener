from fastapi import APIRouter, Query
from typing import List
from datetime import datetime

router = APIRouter()

# Mock data - in production these would come from your database
MOCK_COMPANIES = [
    {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"ticker": "GOOGL", "name": "Alphabet Inc.", "sector": "Technology"},
    {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology"},
    {"ticker": "TSLA", "name": "Tesla Inc.", "sector": "Automotive"},
    {"ticker": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
    {"ticker": "META", "name": "Meta Platforms Inc.", "sector": "Technology"},
    {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Technology"},
    {"ticker": "JPM", "name": "JPMorgan Chase & Co.", "sector": "Financials"},
]

MOCK_DEALS = [
    {"id": "deal-1", "acquirer": "Microsoft", "target": "Activision Blizzard", "value": 68700},
    {"id": "deal-2", "acquirer": "Broadcom", "target": "VMware", "value": 61000},
    {"id": "deal-3", "acquirer": "Pfizer", "target": "Seagen", "value": 43000},
    {"id": "deal-4", "acquirer": "Adobe", "target": "Figma", "value": 20000},
]

@router.get("/search")
async def search_suggestions(q: str = Query(..., min_length=1)):
    """
    Search for companies, deals, and tickers based on query string.
    Returns up to 6 suggestions grouped by type.
    """
    q_lower = q.lower()
    suggestions = []
    
    # Search companies and tickers
    for company in MOCK_COMPANIES:
        if (q_lower in company["name"].lower() or 
            q_lower in company["ticker"].lower() or 
            q_lower in company["sector"].lower()):
            
            # Add as company suggestion
            suggestions.append({
                "type": "company",
                "id": company["ticker"],
                "label": company["name"],
                "value": company["ticker"],
                "subtitle": f"{company['ticker']} • {company['sector']}",
                "ticker": company["ticker"]
            })
            
            # Also add as ticker suggestion if query matches ticker closely
            if q_lower in company["ticker"].lower():
                suggestions.append({
                    "type": "ticker",
                    "id": company["ticker"],
                    "label": company["ticker"],
                    "value": company["ticker"],
                    "subtitle": company["name"],
                    "ticker": company["ticker"]
                })
    
    # Search deals
    for deal in MOCK_DEALS:
        if (q_lower in deal["acquirer"].lower() or 
            q_lower in deal["target"].lower()):
            
            suggestions.append({
                "type": "deal",
                "id": deal["id"],
                "label": f"{deal['acquirer']} → {deal['target']}",
                "value": deal["id"],
                "subtitle": f"${deal['value']:,}M"
            })
    
    # Remove duplicates and limit to 6 suggestions
    seen = set()
    unique_suggestions = []
    for suggestion in suggestions:
        key = f"{suggestion['type']}-{suggestion['value']}"
        if key not in seen:
            seen.add(key)
            unique_suggestions.append(suggestion)
            if len(unique_suggestions) >= 6:
                break
    
    return {"suggestions": unique_suggestions}
