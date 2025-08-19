from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel

from ....core.deps import get_db
from ....models import SavedFilter, SavedDashboard

router = APIRouter()


class FilterCreate(BaseModel):
    user_id: str
    name: str
    kind: str  # comps, precedents, deals, companies
    params: Dict[str, Any]


class FilterUpdate(BaseModel):
    name: Optional[str] = None
    params: Optional[Dict[str, Any]] = None


class DashboardCreate(BaseModel):
    user_id: str
    name: str
    widgets: List[Dict[str, Any]]


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    widgets: Optional[List[Dict[str, Any]]] = None


# Saved Filters endpoints
@router.get("/filters")
async def get_saved_filters(
    user_id: str = Query(..., description="User ID"),
    kind: Optional[str] = Query(None, description="Filter kind"),
    db: Session = Depends(get_db)
):
    """Get saved filters for a user."""
    try:
        # Mock response for now
        mock_filters = []
        kinds = ["comps", "precedents", "deals", "companies"]
        
        for i in range(1, 6):
            filter_kind = kinds[i % len(kinds)] if not kind else kind
            mock_filters.append({
                "id": i,
                "user_id": user_id,
                "name": f"My {filter_kind.title()} Filter #{i}",
                "kind": filter_kind,
                "params": {
                    "sector": "Technology",
                    "region": "North America",
                    "size_min": 1000,
                    "size_max": 10000
                },
                "created_at": (datetime.now() - timedelta(days=i * 3)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=i)).isoformat()
            })
        
        return {"filters": mock_filters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/filters")
async def create_saved_filter(
    filter_data: FilterCreate,
    db: Session = Depends(get_db)
):
    """Create a new saved filter."""
    try:
        # Mock response - would create in DB
        new_filter = {
            "id": 999,
            "user_id": filter_data.user_id,
            "name": filter_data.name,
            "kind": filter_data.kind,
            "params": filter_data.params,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        return new_filter
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/filters/{filter_id}")
async def update_saved_filter(
    filter_id: int,
    filter_data: FilterUpdate,
    db: Session = Depends(get_db)
):
    """Update a saved filter."""
    try:
        # Mock response - would update in DB
        updated_filter = {
            "id": filter_id,
            "name": filter_data.name or f"Updated Filter #{filter_id}",
            "params": filter_data.params or {"sector": "Updated"},
            "updated_at": datetime.now().isoformat()
        }
        return updated_filter
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/filters/{filter_id}")
async def delete_saved_filter(
    filter_id: int,
    db: Session = Depends(get_db)
):
    """Delete a saved filter."""
    try:
        # Mock response - would delete from DB
        return {"message": f"Filter {filter_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Saved Dashboards endpoints
@router.get("/dashboards")
async def get_saved_dashboards(
    user_id: str = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Get saved dashboards for a user."""
    try:
        # Mock response for now
        mock_dashboards = []
        
        for i in range(1, 4):
            mock_dashboards.append({
                "id": i,
                "user_id": user_id,
                "name": f"Custom Dashboard #{i}",
                "widgets": [
                    {"type": "comps_table", "position": {"x": 0, "y": 0, "w": 6, "h": 4}},
                    {"type": "market_chart", "position": {"x": 6, "y": 0, "w": 6, "h": 4}},
                    {"type": "precedents_table", "position": {"x": 0, "y": 4, "w": 12, "h": 6}}
                ],
                "created_at": (datetime.now() - timedelta(days=i * 5)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=i)).isoformat()
            })
        
        return {"dashboards": mock_dashboards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dashboards")
async def create_saved_dashboard(
    dashboard_data: DashboardCreate,
    db: Session = Depends(get_db)
):
    """Create a new saved dashboard."""
    try:
        # Mock response - would create in DB
        new_dashboard = {
            "id": 999,
            "user_id": dashboard_data.user_id,
            "name": dashboard_data.name,
            "widgets": dashboard_data.widgets,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        return new_dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/dashboards/{dashboard_id}")
async def update_saved_dashboard(
    dashboard_id: int,
    dashboard_data: DashboardUpdate,
    db: Session = Depends(get_db)
):
    """Update a saved dashboard."""
    try:
        # Mock response - would update in DB
        updated_dashboard = {
            "id": dashboard_id,
            "name": dashboard_data.name or f"Updated Dashboard #{dashboard_id}",
            "widgets": dashboard_data.widgets or [],
            "updated_at": datetime.now().isoformat()
        }
        return updated_dashboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/dashboards/{dashboard_id}")
async def delete_saved_dashboard(
    dashboard_id: int,
    db: Session = Depends(get_db)
):
    """Delete a saved dashboard."""
    try:
        # Mock response - would delete from DB
        return {"message": f"Dashboard {dashboard_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
