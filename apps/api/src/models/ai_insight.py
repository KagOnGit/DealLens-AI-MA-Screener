from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Index, Enum, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class InsightType(enum.Enum):
    COMPANY_ANALYSIS = "company_analysis"
    DEAL_ANALYSIS = "deal_analysis"
    MARKET_COMMENTARY = "market_commentary"
    ALERT_EXPLANATION = "alert_explanation"
    TREND_ANALYSIS = "trend_analysis"
    RISK_ASSESSMENT = "risk_assessment"
    VALUATION_ANALYSIS = "valuation_analysis"
    SECTOR_OVERVIEW = "sector_overview"


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)  # Can be null for system-wide insights
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=True)
    
    # Insight details
    insight_type = Column(Enum(InsightType), nullable=False)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)  # Brief summary
    full_analysis = Column(Text, nullable=True)  # Detailed analysis
    
    # AI model information
    model_used = Column(String, nullable=True)  # e.g., "gpt-4", "claude-3"
    model_version = Column(String, nullable=True)
    confidence_score = Column(Numeric(3, 2), nullable=True)  # 0-1 confidence
    
    # Context and metadata
    context_data = Column(JSON, nullable=True)  # Additional context used for generation
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    total_cost = Column(Numeric(8, 4), nullable=True)  # Cost in USD
    
    # Insight quality and validation
    is_validated = Column(Boolean, default=False)
    validation_score = Column(Numeric(3, 2), nullable=True)
    user_feedback = Column(String, nullable=True)  # positive, negative, neutral
    
    # Timing and relevance
    is_time_sensitive = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    relevance_score = Column(Numeric(3, 2), nullable=True)  # How relevant to user/query
    
    # Status
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)  # Highlight exceptional insights
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="ai_insights")
    company = relationship("Company", backref="ai_insights")
    deal = relationship("Deal", back_populates="ai_insights")
    
    # Indexes
    __table_args__ = (
        Index('ix_ai_insights_user_id', 'user_id'),
        Index('ix_ai_insights_company_id', 'company_id'),
        Index('ix_ai_insights_deal_id', 'deal_id'),
        Index('ix_ai_insights_insight_type', 'insight_type'),
        Index('ix_ai_insights_is_active', 'is_active'),
        Index('ix_ai_insights_is_featured', 'is_featured'),
        Index('ix_ai_insights_created_at', 'created_at'),
        Index('ix_ai_insights_confidence_score', 'confidence_score'),
    )
