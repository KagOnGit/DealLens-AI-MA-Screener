from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from ....core.deps import get_db
from ....models import Comment

router = APIRouter()


class CommentCreate(BaseModel):
    entity_type: str  # company, deal, pitch
    entity_id: str
    author: str
    body: str


@router.get("/comments")
async def get_comments(
    entity_type: str = Query(..., description="Entity type: company, deal, pitch"),
    entity_id: str = Query(..., description="Entity ID"),
    db: Session = Depends(get_db)
):
    """Get comments for a specific entity."""
    try:
        # Mock response for now
        mock_comments = []
        for i in range(1, 6):  # Mock 5 comments
            comment_date = datetime.now() - timedelta(hours=i * 2)
            authors = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Eva Chen"]
            
            mock_comments.append({
                "id": i,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "author": authors[i - 1],
                "body": f"This is a sample comment #{i} about the {entity_type}. The analysis looks comprehensive and the valuation multiples seem reasonable given the current market conditions.",
                "created_at": comment_date.isoformat()
            })
        
        return {"comments": mock_comments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/comments")
async def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db)
):
    """Create a new comment."""
    try:
        # Mock response - would create in DB
        new_comment = {
            "id": 999,
            "entity_type": comment.entity_type,
            "entity_id": comment.entity_id,
            "author": comment.author,
            "body": comment.body,
            "created_at": datetime.now().isoformat()
        }
        return new_comment
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
