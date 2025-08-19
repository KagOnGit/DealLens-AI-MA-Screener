"""
Debug endpoints for API contract examples and development assistance.
"""
from fastapi import APIRouter
from datetime import datetime
# from app.schemas.responses import DebugContractsResponse, ContractExample

router = APIRouter(tags=["debug"])


@router.get("/_debug/contracts", )
async def get_api_contracts():
    """
    Get example payloads for each API endpoint to aid frontend development.
    This endpoint provides the exact JSON structure that each endpoint returns.
    """
    
    contracts = [
        ContractExample(
            endpoint="/api/v1/companies/{ticker}",
            method="GET",
            example_response={
                "ticker": "AAPL",
                "name": "Apple Inc.",
                "sector": "Technology",
                "industry": "Consumer Electronics",
                "market_cap": 3000000.0,
                "price": 180.50,
                "change": 2.50,
                "change_percent": 1.41,
                "volume": 45000000,
                "pe_ratio": 28.5,
                "ev_ebitda": 22.1,
                "revenue": 394000.0,
                "employees": 164000,
                "headquarters": "Cupertino, CA",
                "founded": 1976,
                "description": "Apple Inc. designs, manufactures, and markets consumer electronics worldwide.",
                "website": "https://apple.com",
                "beta": 1.12,
                "currency": "USD",
                "updated_at": "2024-08-17T18:00:00Z",
                "business_summary": "Apple Inc. is a leading company in the consumer electronics sector.",
                "key_risks": [
                    "Market competition",
                    "Regulatory changes",
                    "Supply chain disruptions"
                ],
                "competitive_moats": [
                    "Strong brand recognition",
                    "Network effects",
                    "Ecosystem lock-in"
                ]
            }
        ),
        
        ContractExample(
            endpoint="/api/v1/companies/{ticker}/timeseries",
            method="GET",
            example_response={
                "revenue": [
                    {"date": "2023-01-01", "value": 81200.0},
                    {"date": "2023-04-01", "value": 84300.0},
                    {"date": "2023-07-01", "value": 87100.0}
                ],
                "ebitda": [
                    {"date": "2023-01-01", "value": 24000.0},
                    {"date": "2023-04-01", "value": 25100.0},
                    {"date": "2023-07-01", "value": 26200.0}
                ],
                "fcf": [
                    {"date": "2023-01-01", "value": 20100.0},
                    {"date": "2023-04-01", "value": 21000.0},
                    {"date": "2023-07-01", "value": 21800.0}
                ],
                "margins": [
                    {"date": "2023-01-01", "gross": 44.1, "ebitda": 29.5, "net": 25.3},
                    {"date": "2023-04-01", "gross": 44.8, "ebitda": 29.8, "net": 25.6},
                    {"date": "2023-07-01", "gross": 45.2, "ebitda": 30.1, "net": 25.9}
                ],
                "multiples": [
                    {"date": "2023-01-01", "pe": 28.5, "ev_ebitda": 22.1},
                    {"date": "2023-04-01", "pe": 29.2, "ev_ebitda": 22.8},
                    {"date": "2023-07-01", "pe": 27.9, "ev_ebitda": 21.5}
                ]
            }
        ),
        
        ContractExample(
            endpoint="/api/v1/companies/{ticker}/ownership",
            method="GET",
            example_response={
                "slices": [
                    {"label": "Institutional", "value": 61.2, "color": "#3B82F6"},
                    {"label": "Retail", "value": 37.8, "color": "#10B981"},
                    {"label": "Insiders", "value": 1.0, "color": "#F59E0B"}
                ],
                "top_holders": [
                    {"name": "Vanguard Group Inc", "percentage": 8.2, "shares": 1345000000},
                    {"name": "BlackRock Inc", "percentage": 6.1, "shares": 1001000000},
                    {"name": "Berkshire Hathaway Inc", "percentage": 5.8, "shares": 952000000}
                ],
                "insider_activity": [
                    {
                        "date": "2024-08-10",
                        "type": "sell",
                        "shares": 50000,
                        "value": 9025000,
                        "person": "Tim Cook (CEO)"
                    }
                ]
            }
        ),
        
        ContractExample(
            endpoint="/api/v1/companies/{ticker}/news",
            method="GET",
            example_response=[
                {
                    "id": "news-1",
                    "headline": "Apple Unveils Next-Generation iPhone with Enhanced AI Features",
                    "source": "TechCrunch",
                    "published_at": "2024-08-17T14:00:00Z",
                    "url": "https://techcrunch.com/apple-iphone-ai",
                    "summary": "Apple introduces advanced AI capabilities in latest iPhone model.",
                    "relevance_score": 0.95,
                    "sentiment": "positive"
                },
                {
                    "id": "news-2",
                    "headline": "Apple Services Revenue Hits New Record High",
                    "source": "Reuters",
                    "published_at": "2024-08-17T12:00:00Z",
                    "url": "https://reuters.com/apple-services-revenue",
                    "summary": "Services segment continues strong growth trajectory.",
                    "relevance_score": 0.88,
                    "sentiment": "positive"
                }
            ]
        ),
        
        ContractExample(
            endpoint="/api/v1/deals",
            method="GET",
            example_response={
                "deals": [
                    {
                        "id": "msft-atvi",
                        "title": "Microsoft acquires Activision Blizzard",
                        "date": "2022-01-18T00:00:00Z",
                        "value_usd": 68700.0,
                        "status": "Closed",
                        "acquirer": "Microsoft Corporation",
                        "target": "Activision Blizzard Inc.",
                        "industry": "Technology",
                        "sizeBucket": "$50B+"
                    },
                    {
                        "id": "amzn-wholefoods",
                        "title": "Amazon acquires Whole Foods Market",
                        "date": "2017-06-16T00:00:00Z",
                        "value_usd": 13700.0,
                        "status": "Closed",
                        "acquirer": "Amazon.com Inc.",
                        "target": "Whole Foods Market Inc.",
                        "industry": "Consumer Discretionary",
                        "sizeBucket": "$10B-$50B"
                    }
                ],
                "total": 15
            }
        ),
        
        ContractExample(
            endpoint="/api/v1/deals/{id}",
            method="GET",
            example_response={
                "id": "msft-atvi",
                "title": "Microsoft acquires Activision Blizzard for $68.7B",
                "status": "Closed",
                "announced_at": "2022-01-18T00:00:00Z",
                "closed_at": "2023-10-13T00:00:00Z",
                "value_usd": 68700.0,
                "premium_pct": 45.3,
                "multiple_ev_ebitda": 13.8,
                "parties": [
                    {
                        "name": "Microsoft Corporation",
                        "ticker": "MSFT",
                        "role": "Acquirer",
                        "industry": "Technology",
                        "country": "United States"
                    },
                    {
                        "name": "Activision Blizzard Inc.",
                        "ticker": "ATVI",
                        "role": "Target",
                        "industry": "Gaming",
                        "country": "United States"
                    }
                ],
                "overview": "Microsoft's acquisition of Activision Blizzard represents the largest gaming acquisition in history.",
                "rationale": [
                    "Accelerate growth in Microsoft's gaming business",
                    "Acquire world-class content and franchises",
                    "Enhance Game Pass subscription service"
                ],
                "kpis": [
                    {"label": "Transaction Value", "value": "$68.7B", "hint": "All-cash transaction"},
                    {"label": "Premium to Market Price", "value": "45.3%", "deltaPct": 45.3},
                    {"label": "EV/EBITDA Multiple", "value": "13.8x", "hint": "Based on 2022 EBITDA"}
                ],
                "timeline": [
                    {
                        "date": "2022-01-18T00:00:00Z",
                        "title": "Deal Announced",
                        "description": "Microsoft announces intent to acquire Activision Blizzard",
                        "type": "Announcement"
                    },
                    {
                        "date": "2023-10-13T00:00:00Z",
                        "title": "Transaction Closes",
                        "description": "Deal officially completed",
                        "type": "Closing"
                    }
                ],
                "news": [
                    {
                        "id": "news-1",
                        "title": "Microsoft Completes $69 Billion Activision Blizzard Deal",
                        "source": "Wall Street Journal",
                        "url": "https://wsj.com/microsoft-activision",
                        "published_at": "2023-10-13T16:00:00Z",
                        "sentiment": "positive",
                        "relevance": 0.98,
                        "summary": "Historic deal completed after regulatory approval"
                    }
                ]
            }
        ),
        
        ContractExample(
            endpoint="/api/v1/search",
            method="GET",
            example_response={
                "suggestions": [
                    {
                        "type": "company",
                        "id": "AAPL",
                        "label": "Apple Inc.",
                        "value": "AAPL",
                        "subtitle": "AAPL • Technology",
                        "ticker": "AAPL"
                    },
                    {
                        "type": "ticker",
                        "id": "AAPL",
                        "label": "AAPL",
                        "value": "AAPL",
                        "subtitle": "Apple Inc.",
                        "ticker": "AAPL"
                    },
                    {
                        "type": "deal",
                        "id": "msft-atvi",
                        "label": "Microsoft → Activision Blizzard",
                        "value": "msft-atvi",
                        "subtitle": "$68.7B • M&A Deal"
                    }
                ]
            }
        )
    ]
    
    return DebugContractsResponse(
        contracts=contracts,
        generated_at=datetime.now().isoformat()
    )


@router.get("/_debug/health")
async def debug_health():
    """Debug endpoint to check API health and dependencies"""
    from app.utils.cache import cache_health_check
    
    cache_status = cache_health_check()
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": {"status": "healthy", "version": "1.0.0"},
            "cache": cache_status,
            "database": {"status": "healthy", "note": "Connection check would go here"}
        },
        "endpoints": {
            "companies": "GET /api/v1/companies/{ticker}",
            "timeseries": "GET /api/v1/companies/{ticker}/timeseries",
            "ownership": "GET /api/v1/companies/{ticker}/ownership",
            "news": "GET /api/v1/companies/{ticker}/news",
            "deals": "GET /api/v1/deals",
            "deal_detail": "GET /api/v1/deals/{id}",
            "search": "GET /api/v1/search?q=",
            "contracts": "GET /api/v1/_debug/contracts"
        }
    }
