from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from ....core.deps import get_db
from ....core.cache import cache_result
from ....models import Rumor
# from ....schemas.pipeline import PipelineResponse, RumorItem

router = APIRouter()


@router.get("/", )
@cache_result(expire=900)  # Cache for 15 minutes
async def get_pipeline(
    confidence_min: Optional[float] = Query(0.5, description="Minimum confidence level (0.0-1.0)"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    source: Optional[str] = Query(None, description="Filter by source"),
    days_back: int = Query(30, description="Days to look back"),
    db: Session = Depends(get_db)
):
    """Get deal pipeline and rumors with confidence scoring."""
    try:
        # Mock response for now
        base_date = datetime.now()
        
        mock_rumors = []
        sources = ["Bloomberg", "Reuters", "Financial Times", "Wall Street Journal", "Market Watch"]
        sectors = ["Technology", "Healthcare", "Financial Services", "Energy", "Consumer", "Industrials"]
        
        for i in range(1, 16):
            rumor_date = base_date - timedelta(days=i * 2)
            confidence = 0.3 + (i % 7) * 0.1  # Vary confidence between 0.3 and 0.9
            
            if confidence >= confidence_min:
                mock_rumors.append({
                    "id": i,
                    "subject_ticker": f"SUBJ{i:02d}",
                    "subject_name": f"Subject Corp {i}",
                    "counterparty": f"Buyer Inc {i}" if i % 2 == 0 else None,
                    "sector": sector or sectors[i % len(sectors)],
                    "confidence": round(confidence, 2),
                    "source": sources[i % len(sources)],
                    "url": f"https://example.com/news/rumor-{i}",
                    "noted_at": rumor_date.isoformat(),
                    "summary": f"Reports suggest potential acquisition interest in {f'SUBJ{i:02d}'} with multiple parties conducting due diligence.",
                    "estimated_value": (500 + i * 200) if i % 3 == 0 else None,
                    "stage": ["Speculation", "Due Diligence", "Advanced Talks"][min(i % 3, 2)]
                })
        
        # Filter by confidence
        filtered_rumors = [r for r in mock_rumors if r["confidence"] >= confidence_min]
        
        response = {
            "rumors": filtered_rumors,
            "summary": {
                "total_items": len(filtered_rumors),
                "avg_confidence": round(sum(r["confidence"] for r in filtered_rumors) / max(len(filtered_rumors), 1), 2),
                "by_sector": {
                    s: len([r for r in filtered_rumors if r["sector"] == s])
                    for s in set(r["sector"] for r in filtered_rumors)
                },
                "by_stage": {
                    "Speculation": len([r for r in filtered_rumors if r["stage"] == "Speculation"]),
                    "Due Diligence": len([r for r in filtered_rumors if r["stage"] == "Due Diligence"]),
                    "Advanced Talks": len([r for r in filtered_rumors if r["stage"] == "Advanced Talks"])
                }
            },
            "filters": {
                "confidence_min": confidence_min,
                "sector": sector,
                "source": source,
                "days_back": days_back
            }
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
