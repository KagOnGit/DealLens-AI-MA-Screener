from sqlalchemy import Column, String, DateTime, Index, Enum, Numeric, Text
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class InsightScope(enum.Enum):
    COMPANY = "company"
    DEAL = "deal"
    ANALYTICS = "analytics"
    SECTOR = "sector"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, index=True)
    scope = Column(Enum(InsightScope), nullable=False, index=True)
    ref_key = Column(String(100), nullable=False, index=True)  # ticker, deal_id, period, etc.
    
    # AI-generated content
    text = Column(Text, nullable=False)
    summary = Column(String(1000), nullable=True)  # Short summary for preview
    
    # Quality metrics
    confidence = Column(Numeric(3, 2), nullable=True)  # 0.0 to 1.0
    model_used = Column(String(50), nullable=True)  # e.g., "gpt-4o-mini"
    tokens_used = Column(Numeric(8, 0), nullable=True)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Indexes
    __table_args__ = (
        Index('ix_ai_insights_scope_ref', 'scope', 'ref_key'),
        Index('ix_ai_insights_updated', 'updated_at'),
    )
