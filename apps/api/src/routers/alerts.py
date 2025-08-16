from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models import Alert, AlertType, AlertSeverity, AlertStatus, Company, User
from ..deps import PaginationParams, FilterParams, paginate_query, apply_sorting, generate_id

router = APIRouter()


class AlertsFilterParams(FilterParams):
    """Alerts-specific filter parameters."""
    def __init__(
        self,
        severity: Optional[str] = Query(None, description="Filter by severity (low, medium, high, critical)"),
        alert_type: Optional[str] = Query(None, description="Filter by alert type"),
        status: Optional[str] = Query(None, description="Filter by status (active, triggered, paused, expired)"),
        unread_only: Optional[bool] = Query(False, description="Show only unread alerts"),
        ticker: Optional[str] = Query(None, description="Filter by ticker symbol"),
        **kwargs
    ):
        super().__init__(**kwargs)
        self.severity = severity
        self.alert_type = alert_type
        self.status = status
        self.unread_only = unread_only
        self.ticker = ticker


@router.get("", response_model=Dict[str, Any])
async def list_alerts(
    db: Session = Depends(get_db),
    pagination: PaginationParams = Depends(),
    filters: AlertsFilterParams = Depends(),
    current_user: User = Depends(get_current_user)
):
    """List user's alerts with filtering and pagination."""
    
    # Base query for current user's alerts
    query = db.query(Alert).filter(Alert.user_id == current_user.id)
    
    # Apply filters
    if filters.severity:
        try:
            severity_enum = AlertSeverity(filters.severity)
            query = query.filter(Alert.severity == severity_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity: {filters.severity}")
    
    if filters.alert_type:
        try:
            type_enum = AlertType(filters.alert_type)
            query = query.filter(Alert.type == type_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid alert type: {filters.alert_type}")
    
    if filters.status:
        try:
            status_enum = AlertStatus(filters.status)
            query = query.filter(Alert.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {filters.status}")
    
    if filters.unread_only:
        query = query.filter(Alert.read == False)
    
    if filters.ticker:
        query = query.filter(Alert.ticker.ilike(f"%{filters.ticker}%"))
    
    # Apply search on title and message
    if filters.query:
        search_term = f"%{filters.query}%"
        query = query.filter(
            or_(
                Alert.title.ilike(search_term),
                Alert.message.ilike(search_term),
                Alert.ticker.ilike(search_term)
            )
        )
    
    # Apply sorting (default to most recent first)
    query = apply_sorting(query, Alert, filters.sort_by or "created_at", filters.sort_order)
    
    # Paginate results
    result = paginate_query(query, pagination)
    
    # Format alerts with additional company information
    formatted_alerts = []
    for alert in result["items"]:
        alert_data = {
            "id": alert.id,
            "ticker": alert.ticker,
            "type": alert.type.value,
            "severity": alert.severity.value,
            "status": alert.status.value,
            "title": alert.title,
            "message": alert.message,
            "threshold_num": float(alert.threshold_num) if alert.threshold_num else None,
            "threshold_text": alert.threshold_text,
            "read": alert.read,
            "dismissed": alert.dismissed,
            "triggered_at": alert.triggered_at.isoformat() if alert.triggered_at else None,
            "trigger_value": float(alert.trigger_value) if alert.trigger_value else None,
            "created_at": alert.created_at.isoformat(),
            "expires_at": alert.expires_at.isoformat() if alert.expires_at else None
        }
        
        # Add company information if ticker is present
        if alert.ticker:
            company = db.query(Company).filter(Company.ticker == alert.ticker).first()
            if company:
                alert_data["company"] = {
                    "name": company.name,
                    "sector": company.sector,
                    "current_price": float(company.last_price) if company.last_price else None
                }
        
        formatted_alerts.append(alert_data)
    
    result["items"] = formatted_alerts
    return result


@router.post("/custom", status_code=status.HTTP_201_CREATED)
async def create_custom_alert(
    alert_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update a custom alert rule."""
    
    # Validate required fields
    required_fields = ["type"]
    for field in required_fields:
        if field not in alert_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    try:
        alert_type = AlertType(alert_data["type"])
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid alert type: {alert_data['type']}")
    
    # If ID is provided, update existing alert
    if "id" in alert_data and alert_data["id"]:
        existing_alert = db.query(Alert).filter(
            and_(Alert.id == alert_data["id"], Alert.user_id == current_user.id)
        ).first()
        
        if not existing_alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Update fields
        existing_alert.type = alert_type
        existing_alert.ticker = alert_data.get("ticker")
        existing_alert.threshold_num = alert_data.get("threshold")
        existing_alert.threshold_text = alert_data.get("threshold_text")
        existing_alert.title = alert_data.get("title", f"{alert_type.value} alert for {alert_data.get('ticker', 'market')}")
        existing_alert.severity = AlertSeverity(alert_data.get("severity", "medium"))
        existing_alert.status = AlertStatus.ACTIVE if alert_data.get("active", True) else AlertStatus.PAUSED
        existing_alert.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(existing_alert)
        
        return {
            "id": existing_alert.id,
            "message": "Alert updated successfully",
            "alert": {
                "id": existing_alert.id,
                "type": existing_alert.type.value,
                "ticker": existing_alert.ticker,
                "status": existing_alert.status.value
            }
        }
    
    else:
        # Create new alert
        # Validate ticker if provided
        if alert_data.get("ticker"):
            company = db.query(Company).filter(Company.ticker == alert_data["ticker"].upper()).first()
            if not company:
                raise HTTPException(status_code=400, detail=f"Company with ticker {alert_data['ticker']} not found")
        
        # Generate appropriate title and message
        ticker = alert_data.get("ticker", "").upper() if alert_data.get("ticker") else None
        threshold = alert_data.get("threshold")
        
        if alert_type == AlertType.PRICE_ABOVE:
            title = f"{ticker} price above ${threshold}" if ticker and threshold else "Price above threshold"
            message = f"Alert when {ticker} price exceeds ${threshold}"
        elif alert_type == AlertType.PRICE_BELOW:
            title = f"{ticker} price below ${threshold}" if ticker and threshold else "Price below threshold"
            message = f"Alert when {ticker} price falls below ${threshold}"
        elif alert_type == AlertType.PCT_MOVE:
            title = f"{ticker} price move >{threshold}%" if ticker and threshold else "Large price movement"
            message = f"Alert when {ticker} moves more than {threshold}% in a day"
        else:
            title = alert_data.get("title", f"{alert_type.value} alert")
            message = alert_data.get("message", f"Custom {alert_type.value} alert")
        
        new_alert = Alert(
            id=generate_id("alert"),
            user_id=current_user.id,
            type=alert_type,
            ticker=ticker,
            threshold_num=threshold,
            threshold_text=alert_data.get("threshold_text"),
            title=title,
            message=message,
            severity=AlertSeverity(alert_data.get("severity", "medium")),
            status=AlertStatus.ACTIVE if alert_data.get("active", True) else AlertStatus.PAUSED
        )
        
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)
        
        return {
            "id": new_alert.id,
            "message": "Alert created successfully",
            "alert": {
                "id": new_alert.id,
                "type": new_alert.type.value,
                "ticker": new_alert.ticker,
                "status": new_alert.status.value,
                "title": new_alert.title
            }
        }


@router.post("/{alert_id}/read")
async def mark_alert_read(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark an alert as read."""
    
    alert = db.query(Alert).filter(
        and_(Alert.id == alert_id, Alert.user_id == current_user.id)
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.read = True
    alert.read_at = datetime.utcnow()
    alert.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Alert marked as read", "read": True}


@router.post("/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Dismiss an alert."""
    
    alert = db.query(Alert).filter(
        and_(Alert.id == alert_id, Alert.user_id == current_user.id)
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.dismissed = True
    alert.dismissed_at = datetime.utcnow()
    alert.updated_at = datetime.utcnow()
    
    # Also mark as read
    if not alert.read:
        alert.read = True
        alert.read_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Alert dismissed", "dismissed": True}


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an alert (custom alerts only)."""
    
    alert = db.query(Alert).filter(
        and_(Alert.id == alert_id, Alert.user_id == current_user.id)
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Only allow deletion of custom alerts (not system-generated ones)
    if alert.type in [AlertType.PRICE_ABOVE, AlertType.PRICE_BELOW, AlertType.PCT_MOVE]:
        db.delete(alert)
        db.commit()
        return {"message": "Alert deleted successfully"}
    else:
        raise HTTPException(
            status_code=400, 
            detail="System alerts cannot be deleted, only dismissed"
        )


@router.post("/{alert_id}/snooze")
async def snooze_alert(
    alert_id: str,
    snooze_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Snooze an alert for a specified duration."""
    
    alert = db.query(Alert).filter(
        and_(Alert.id == alert_id, Alert.user_id == current_user.id)
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Validate snooze duration (in minutes)
    snooze_minutes = snooze_data.get("minutes", 60)
    if not isinstance(snooze_minutes, int) or snooze_minutes < 1:
        raise HTTPException(status_code=400, detail="Invalid snooze duration")
    
    from datetime import timedelta
    snooze_until = datetime.utcnow() + timedelta(minutes=snooze_minutes)
    
    alert.snoozed_until = snooze_until
    alert.status = AlertStatus.PAUSED
    alert.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": f"Alert snoozed for {snooze_minutes} minutes",
        "snoozed_until": snooze_until.isoformat()
    }


@router.get("/stats")
async def get_alert_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's alert statistics."""
    
    # Total alerts
    total_alerts = db.query(Alert).filter(Alert.user_id == current_user.id).count()
    
    # Unread alerts
    unread_alerts = db.query(Alert).filter(
        and_(Alert.user_id == current_user.id, Alert.read == False)
    ).count()
    
    # Active alerts
    active_alerts = db.query(Alert).filter(
        and_(Alert.user_id == current_user.id, Alert.status == AlertStatus.ACTIVE)
    ).count()
    
    # Triggered alerts (last 7 days)
    from datetime import timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    recent_triggered = db.query(Alert).filter(
        and_(
            Alert.user_id == current_user.id,
            Alert.triggered_at >= week_ago,
            Alert.status == AlertStatus.TRIGGERED
        )
    ).count()
    
    # Alerts by type
    type_counts = db.query(
        Alert.type,
        func.count(Alert.id).label('count')
    ).filter(Alert.user_id == current_user.id).group_by(Alert.type).all()
    
    type_distribution = {alert_type.value: count for alert_type, count in type_counts}
    
    # Alerts by severity
    severity_counts = db.query(
        Alert.severity,
        func.count(Alert.id).label('count')
    ).filter(Alert.user_id == current_user.id).group_by(Alert.severity).all()
    
    severity_distribution = {severity.value: count for severity, count in severity_counts}
    
    return {
        "total_alerts": total_alerts,
        "unread_alerts": unread_alerts,
        "active_alerts": active_alerts,
        "recent_triggered": recent_triggered,
        "type_distribution": type_distribution,
        "severity_distribution": severity_distribution
    }


@router.post("/bulk-action")
async def bulk_alert_action(
    action_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Perform bulk actions on alerts (mark all read, dismiss multiple, etc.)."""
    
    action = action_data.get("action")
    alert_ids = action_data.get("alert_ids", [])
    
    if not action:
        raise HTTPException(status_code=400, detail="Action is required")
    
    if action not in ["mark_read", "dismiss", "delete"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    # If no specific IDs provided, apply to all user's unread alerts
    if not alert_ids and action == "mark_read":
        affected_alerts = db.query(Alert).filter(
            and_(Alert.user_id == current_user.id, Alert.read == False)
        ).all()
    else:
        # Apply to specific alerts
        affected_alerts = db.query(Alert).filter(
            and_(Alert.user_id == current_user.id, Alert.id.in_(alert_ids))
        ).all()
    
    if not affected_alerts:
        return {"message": "No alerts to update", "affected_count": 0}
    
    affected_count = 0
    current_time = datetime.utcnow()
    
    for alert in affected_alerts:
        if action == "mark_read" and not alert.read:
            alert.read = True
            alert.read_at = current_time
            alert.updated_at = current_time
            affected_count += 1
        
        elif action == "dismiss" and not alert.dismissed:
            alert.dismissed = True
            alert.dismissed_at = current_time
            alert.updated_at = current_time
            if not alert.read:
                alert.read = True
                alert.read_at = current_time
            affected_count += 1
        
        elif action == "delete" and alert.type in [AlertType.PRICE_ABOVE, AlertType.PRICE_BELOW, AlertType.PCT_MOVE]:
            db.delete(alert)
            affected_count += 1
    
    db.commit()
    
    return {
        "message": f"Bulk {action} completed",
        "affected_count": affected_count
    }
