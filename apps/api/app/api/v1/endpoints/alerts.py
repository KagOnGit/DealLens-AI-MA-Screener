from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

router = APIRouter()

# Mock alerts data - in production this would be a database
MOCK_ALERTS = [
    {
        "id": "alert-1",
        "title": "Microsoft-Activision Deal Update",
        "body": "Regulatory approval progress reported for $68.7B acquisition. CMA approval pending final review.",
        "ticker": "MSFT",
        "severity": "medium",
        "created_at": (datetime.now() - timedelta(hours=2)).isoformat(),
        "read": False,
        "type": "deal",
        "related_deal_id": "deal-1",
        "related_company_ticker": "MSFT"
    },
    {
        "id": "alert-2", 
        "title": "Apple Q4 Earnings Beat",
        "body": "Apple reported Q4 earnings of $1.46 per share, beating analysts' estimates of $1.39. Revenue came in at $89.5B vs expected $89.3B.",
        "ticker": "AAPL",
        "severity": "low",
        "created_at": (datetime.now() - timedelta(hours=4)).isoformat(),
        "read": True,
        "type": "news",
        "related_company_ticker": "AAPL"
    },
    {
        "id": "alert-3",
        "title": "Market Volatility Alert",
        "body": "High volatility detected across tech sector. VIX up 15% in past hour. Consider portfolio rebalancing.",
        "severity": "high",
        "created_at": (datetime.now() - timedelta(hours=1)).isoformat(),
        "read": False,
        "type": "market"
    },
    {
        "id": "alert-4",
        "title": "Tesla Production Numbers",
        "body": "Tesla announced record Q4 production of 484,507 vehicles, exceeding guidance. Delivery numbers expected next week.",
        "ticker": "TSLA",
        "severity": "low",
        "created_at": (datetime.now() - timedelta(hours=6)).isoformat(),
        "read": False,
        "type": "news",
        "related_company_ticker": "TSLA"
    },
    {
        "id": "alert-5",
        "title": "System Maintenance Scheduled",
        "body": "Scheduled maintenance window on Sunday 2-4 AM EST. Data feeds may be intermittent during this period.",
        "severity": "low",
        "created_at": (datetime.now() - timedelta(hours=12)).isoformat(),
        "read": True,
        "type": "system"
    }
]

@router.get("/alerts")
async def get_alerts(
    unread: Optional[bool] = None,
    limit: Optional[int] = Query(default=20, le=100),
    offset: Optional[int] = Query(default=0, ge=0)
):
    """Get alerts with optional filtering."""
    alerts = MOCK_ALERTS.copy()
    
    # Filter by unread status if specified
    if unread is not None:
        alerts = [alert for alert in alerts if alert["read"] != unread]
    
    # Calculate total and unread count
    total = len(alerts)
    unread_count = len([alert for alert in MOCK_ALERTS if not alert["read"]])
    
    # Apply pagination
    alerts = alerts[offset:offset + limit] if limit else alerts[offset:]
    
    return {
        "alerts": alerts,
        "total": total,
        "unread_count": unread_count
    }

@router.get("/alerts/{alert_id}")
async def get_alert(alert_id: str):
    """Get a specific alert by ID."""
    alert = next((alert for alert in MOCK_ALERTS if alert["id"] == alert_id), None)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    return alert

@router.post("/alerts/mark-all-read")
async def mark_all_alerts_read():
    """Mark all alerts as read."""
    for alert in MOCK_ALERTS:
        alert["read"] = True
    
    return {"message": "All alerts marked as read"}

@router.post("/alerts/clear")
async def clear_all_alerts():
    """Clear all alerts."""
    MOCK_ALERTS.clear()
    
    return {"message": "All alerts cleared"}

@router.put("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str):
    """Mark a specific alert as read."""
    alert = next((alert for alert in MOCK_ALERTS if alert["id"] == alert_id), None)
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert["read"] = True
    
    return {"message": "Alert marked as read"}

@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str):
    """Delete a specific alert."""
    global MOCK_ALERTS
    
    alert_index = next((i for i, alert in enumerate(MOCK_ALERTS) if alert["id"] == alert_id), None)
    
    if alert_index is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    MOCK_ALERTS.pop(alert_index)
    
    return {"message": "Alert deleted"}

@router.post("/alerts")
async def create_alert(
    title: str,
    body: str,
    ticker: Optional[str] = None,
    severity: str = "low",
    alert_type: Optional[str] = None,
    related_deal_id: Optional[str] = None,
    related_company_ticker: Optional[str] = None
):
    """Create a new alert."""
    new_alert = {
        "id": f"alert-{uuid.uuid4().hex[:8]}",
        "title": title,
        "body": body,
        "ticker": ticker,
        "severity": severity,
        "created_at": datetime.now().isoformat(),
        "read": False,
        "type": alert_type,
        "related_deal_id": related_deal_id,
        "related_company_ticker": related_company_ticker
    }
    
    MOCK_ALERTS.insert(0, new_alert)  # Add to beginning for newest first
    
    return new_alert
