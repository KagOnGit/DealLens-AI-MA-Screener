from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from datetime import datetime

app = FastAPI()

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/status")
async def status():
    return {"status": "ok", "service": "api"}

# Mock data for development
mock_alerts = [
    {
        "id": "1",
        "title": "New M&A Deal Announced",
        "body": "Tech Corp announced acquisition of StartupXYZ for $500M",
        "ticker": "TECH",
        "severity": "high",
        "created_at": datetime.now().isoformat(),
        "read": False,
        "type": "deal"
    },
    {
        "id": "2",
        "title": "Market Update",
        "body": "Healthcare sector showing strong performance",
        "severity": "medium",
        "created_at": datetime.now().isoformat(),
        "read": True,
        "type": "market"
    }
]

mock_deals = [
    {
        "id": "1",
        "acquirer": "Tech Corp",
        "target": "StartupXYZ",
        "value": 500,
        "status": "announced",
        "announced_at": datetime.now().isoformat(),
        "deal_type": "acquisition",
        "sector": "Technology"
    },
    {
        "id": "2",
        "acquirer": "Healthcare Inc",
        "target": "Biotech Solutions",
        "value": 1200,
        "status": "pending",
        "announced_at": datetime.now().isoformat(),
        "deal_type": "merger",
        "sector": "Healthcare"
    }
]

mock_companies = [
    {
        "ticker": "TECH",
        "name": "Tech Corp",
        "sector": "Technology",
        "industry": "Software",
        "market_cap": 50000,
        "price": 125.50,
        "change": 2.30,
        "change_percent": 1.87
    },
    {
        "ticker": "HLTH",
        "name": "Healthcare Inc",
        "sector": "Healthcare",
        "industry": "Biotechnology",
        "market_cap": 25000,
        "price": 89.75,
        "change": -1.25,
        "change_percent": -1.37
    }
]

# API v1 endpoints
@app.get("/api/v1/alerts")
async def get_alerts(
    limit: int = Query(10, ge=1, le=100),
    unread: Optional[bool] = None
):
    filtered_alerts = mock_alerts
    if unread is not None:
        filtered_alerts = [alert for alert in mock_alerts if alert["read"] != unread]
    
    limited_alerts = filtered_alerts[:limit]
    unread_count = len([alert for alert in mock_alerts if not alert["read"]])
    
    return {
        "alerts": limited_alerts,
        "total": len(filtered_alerts),
        "unread_count": unread_count
    }

@app.get("/api/v1/alerts/{alert_id}")
async def get_alert(alert_id: str):
    alert = next((alert for alert in mock_alerts if alert["id"] == alert_id), None)
    if not alert:
        return {"error": "Alert not found"}, 404
    return alert

@app.post("/api/v1/alerts/mark-all-read")
async def mark_all_alerts_read():
    for alert in mock_alerts:
        alert["read"] = True
    return {"message": "All alerts marked as read"}

@app.delete("/api/v1/alerts/clear")
async def clear_all_alerts():
    mock_alerts.clear()
    return {"message": "All alerts cleared"}

@app.put("/api/v1/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    alert = next((alert for alert in mock_alerts if alert["id"] == alert_id), None)
    if not alert:
        return {"error": "Alert not found"}, 404
    alert["read"] = True
    return {"message": "Alert marked as read"}

@app.get("/api/v1/deals")
async def get_deals(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    status: Optional[str] = None,
    sort: Optional[str] = None
):
    filtered_deals = mock_deals
    if status:
        filtered_deals = [deal for deal in mock_deals if deal["status"] == status]
    
    # Simple pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_deals = filtered_deals[start_idx:end_idx]
    
    return {
        "deals": paginated_deals,
        "total": len(filtered_deals)
    }

@app.get("/api/v1/deals/{deal_id}")
async def get_deal(deal_id: str):
    deal = next((deal for deal in mock_deals if deal["id"] == deal_id), None)
    if not deal:
        return {"error": "Deal not found"}, 404
    return deal

@app.get("/api/v1/companies")
async def get_companies(
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    q: Optional[str] = None
):
    filtered_companies = mock_companies
    if q:
        filtered_companies = [
            company for company in mock_companies 
            if q.lower() in company["name"].lower() or q.lower() in company["ticker"].lower()
        ]
    
    # Simple pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_companies = filtered_companies[start_idx:end_idx]
    
    return {
        "companies": paginated_companies,
        "total": len(filtered_companies),
        "page": page,
        "per_page": limit
    }

@app.get("/api/v1/companies/{ticker}")
async def get_company(ticker: str):
    company = next((company for company in mock_companies if company["ticker"].upper() == ticker.upper()), None)
    if not company:
        return {"error": "Company not found"}, 404
    return company

@app.get("/api/v1/search")
async def search_suggestions(q: str = Query(..., min_length=1)):
    suggestions = []
    
    # Search companies
    for company in mock_companies:
        if q.lower() in company["name"].lower() or q.lower() in company["ticker"].lower():
            suggestions.append({
                "type": "company",
                "id": company["ticker"],
                "label": company["name"],
                "value": company["ticker"],
                "subtitle": company["sector"],
                "ticker": company["ticker"]
            })
    
    # Search deals
    for deal in mock_deals:
        if q.lower() in deal["acquirer"].lower() or q.lower() in deal["target"].lower():
            suggestions.append({
                "type": "deal",
                "id": deal["id"],
                "label": f"{deal['acquirer']} acquiring {deal['target']}",
                "value": deal["id"],
                "subtitle": f"${deal['value']}M {deal['status']}"
            })
    
    return {"suggestions": suggestions[:10]}  # Limit to 10 suggestions

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
