from typing import Optional, Dict, Any, List
from fastapi import Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, asc
import math


class PaginationParams:
    """Common pagination parameters."""
    def __init__(
        self,
        page: int = Query(1, ge=1, description="Page number"),
        limit: int = Query(50, ge=1, le=100, description="Items per page"),
    ):
        self.page = page
        self.limit = limit
        self.offset = (page - 1) * limit


class FilterParams:
    """Common filter parameters."""
    def __init__(
        self,
        query: Optional[str] = Query(None, description="Search query"),
        sort_by: Optional[str] = Query(None, description="Sort field"),
        sort_order: Optional[str] = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    ):
        self.query = query
        self.sort_by = sort_by
        self.sort_order = sort_order


def paginate_query(
    db_query, 
    pagination: PaginationParams,
    total_count: Optional[int] = None
) -> Dict[str, Any]:
    """Apply pagination to a SQLAlchemy query and return paginated results."""
    
    # Get total count if not provided
    if total_count is None:
        total_count = db_query.count()
    
    # Apply pagination
    items = db_query.offset(pagination.offset).limit(pagination.limit).all()
    
    # Calculate pagination metadata
    total_pages = math.ceil(total_count / pagination.limit)
    
    return {
        "items": items,
        "pagination": {
            "page": pagination.page,
            "limit": pagination.limit,
            "total": total_count,
            "total_pages": total_pages,
            "has_next": pagination.page < total_pages,
            "has_prev": pagination.page > 1
        }
    }


def apply_sorting(query, model, sort_by: Optional[str], sort_order: str = "desc"):
    """Apply sorting to a SQLAlchemy query."""
    if not sort_by:
        return query
    
    if not hasattr(model, sort_by):
        raise HTTPException(status_code=400, detail=f"Invalid sort field: {sort_by}")
    
    field = getattr(model, sort_by)
    if sort_order.lower() == "asc":
        return query.order_by(asc(field))
    else:
        return query.order_by(desc(field))


def apply_search(query, model, search_fields: List[str], search_term: Optional[str]):
    """Apply search filter to a SQLAlchemy query."""
    if not search_term or not search_fields:
        return query
    
    search_conditions = []
    for field_name in search_fields:
        if hasattr(model, field_name):
            field = getattr(model, field_name)
            if hasattr(field.type, 'python_type') and field.type.python_type == str:
                search_conditions.append(field.ilike(f"%{search_term}%"))
    
    if search_conditions:
        from sqlalchemy import or_
        return query.filter(or_(*search_conditions))
    
    return query


def validate_date_range(start_date: Optional[str], end_date: Optional[str]) -> tuple:
    """Validate and parse date range parameters."""
    from datetime import datetime
    
    parsed_start = None
    parsed_end = None
    
    if start_date:
        try:
            parsed_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
    
    if end_date:
        try:
            parsed_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
    
    if parsed_start and parsed_end and parsed_start > parsed_end:
        raise HTTPException(status_code=400, detail="start_date must be before end_date")
    
    return parsed_start, parsed_end


def format_currency(amount: Optional[float], currency: str = "USD") -> Optional[str]:
    """Format currency amount for display."""
    if amount is None:
        return None
    
    if amount >= 1e12:
        return f"${amount/1e12:.1f}T"
    elif amount >= 1e9:
        return f"${amount/1e9:.1f}B"
    elif amount >= 1e6:
        return f"${amount/1e6:.1f}M"
    elif amount >= 1e3:
        return f"${amount/1e3:.1f}K"
    else:
        return f"${amount:,.0f}"


def calculate_change_percent(current: float, previous: float) -> Optional[float]:
    """Calculate percentage change between two values."""
    if previous == 0:
        return None
    return ((current - previous) / previous) * 100


def generate_id(prefix: str = "") -> str:
    """Generate unique ID with optional prefix."""
    import uuid
    unique_id = str(uuid.uuid4())
    return f"{prefix}_{unique_id}" if prefix else unique_id
