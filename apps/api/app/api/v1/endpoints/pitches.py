from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ....core.deps import get_db
from ....models import Pitch

router = APIRouter()


class PitchCreate(BaseModel):
    title: str
    sector: Optional[str] = None
    stage: str = "idea"
    probability: float = 0.25
    value: Optional[float] = None
    owner: Optional[str] = None
    notes: Optional[str] = None


class PitchUpdate(BaseModel):
    title: Optional[str] = None
    sector: Optional[str] = None
    stage: Optional[str] = None
    probability: Optional[float] = None
    value: Optional[float] = None
    owner: Optional[str] = None
    notes: Optional[str] = None


@router.get("/")
async def get_pitches(
    stage: Optional[str] = Query(None, description="Filter by stage"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    owner: Optional[str] = Query(None, description="Filter by owner"),
    db: Session = Depends(get_db)
):
    """Get all pitches with optional filters."""
    try:
        # Mock response for now
        stages = ["idea", "pitch", "mandate", "won", "lost"]
        sectors = ["Technology", "Healthcare", "Financial Services", "Energy"]
        owners = ["John Smith", "Sarah Johnson", "Mike Davis", "Lisa Chen"]
        
        mock_pitches = []
        for i in range(1, 16):
            stage_val = stages[i % len(stages)] if not stage else stage
            sector_val = sectors[i % len(sectors)] if not sector else sector
            owner_val = owners[i % len(owners)] if not owner else owner
            
            mock_pitches.append({
                "id": i,
                "title": f"Strategic Acquisition Opportunity #{i}",
                "sector": sector_val,
                "stage": stage_val,
                "probability": min(0.95, 0.15 + (i * 0.05)),
                "value": 500 + (i * 150),
                "owner": owner_val,
                "notes": f"Preliminary discussions initiated with target company in {sector_val} sector.",
                "created_at": (datetime.now() - timedelta(days=i * 5)).isoformat(),
                "updated_at": (datetime.now() - timedelta(days=i)).isoformat()
            })
        
        return {"pitches": mock_pitches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_pitch(
    pitch: PitchCreate,
    db: Session = Depends(get_db)
):
    """Create a new pitch."""
    try:
        # Mock response - would create in DB
        new_pitch = {
            "id": 999,
            "title": pitch.title,
            "sector": pitch.sector,
            "stage": pitch.stage,
            "probability": pitch.probability,
            "value": pitch.value,
            "owner": pitch.owner,
            "notes": pitch.notes,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        return new_pitch
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{pitch_id}")
async def update_pitch(
    pitch_id: int,
    pitch: PitchUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing pitch."""
    try:
        # Mock response - would update in DB
        updated_pitch = {
            "id": pitch_id,
            "title": pitch.title or f"Updated Pitch #{pitch_id}",
            "sector": pitch.sector or "Technology",
            "stage": pitch.stage or "pitch",
            "probability": pitch.probability or 0.5,
            "value": pitch.value or 1000,
            "owner": pitch.owner or "John Smith",
            "notes": pitch.notes or "Updated notes",
            "updated_at": datetime.now().isoformat()
        }
        return updated_pitch
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{pitch_id}")
async def delete_pitch(
    pitch_id: int,
    db: Session = Depends(get_db)
):
    """Delete a pitch."""
    try:
        # Mock response - would delete from DB
        return {"message": f"Pitch {pitch_id} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
