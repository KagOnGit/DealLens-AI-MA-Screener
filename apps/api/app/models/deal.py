from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, Text, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import enum
from ..core.database import Base


class DealStatus(enum.Enum):
    ANNOUNCED = "announced"
    PENDING_REGULATORY = "pending_regulatory"
    REGULATORY_APPROVED = "regulatory_approved"
    COMPLETED = "completed"
    TERMINATED = "terminated"
    WITHDRAWN = "withdrawn"


class DealType(enum.Enum):
    ACQUISITION = "acquisition"
    MERGER = "merger"
    SPIN_OFF = "spin_off"
    DIVESTITURE = "divestiture"
    JOINT_VENTURE = "joint_venture"
    TAKE_PRIVATE = "take_private"


class PaymentType(enum.Enum):
    CASH = "cash"
    STOCK = "stock"
    MIXED = "mixed"
    OTHER = "other"


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, index=True)
    
    # Deal basic info
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    deal_type = Column(Enum(DealType), nullable=False)
    status = Column(Enum(DealStatus), default=DealStatus.ANNOUNCED)
    
    # Companies involved
    acquirer_id = Column(String, ForeignKey("companies.id"), nullable=False)
    target_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Financial details
    deal_value = Column(Numeric(15, 2), nullable=True)  # Total transaction value
    enterprise_value = Column(Numeric(15, 2), nullable=True)
    equity_value = Column(Numeric(15, 2), nullable=True)
    premium_percent = Column(Numeric(5, 2), nullable=True)  # Premium over market price
    revenue_multiple = Column(Numeric(5, 2), nullable=True)
    ebitda_multiple = Column(Numeric(5, 2), nullable=True)
    
    # Payment structure
    payment_type = Column(Enum(PaymentType), nullable=True)
    cash_amount = Column(Numeric(15, 2), nullable=True)
    stock_amount = Column(Numeric(15, 2), nullable=True)
    debt_assumed = Column(Numeric(15, 2), nullable=True)
    
    # Timeline
    announced_date = Column(DateTime(timezone=True), nullable=True)
    expected_close_date = Column(DateTime(timezone=True), nullable=True)
    completed_date = Column(DateTime(timezone=True), nullable=True)
    terminated_date = Column(DateTime(timezone=True), nullable=True)
    
    # Deal rationale and synergies
    strategic_rationale = Column(Text, nullable=True)
    cost_synergies = Column(Numeric(15, 2), nullable=True)
    revenue_synergies = Column(Numeric(15, 2), nullable=True)
    
    # Regulatory and legal
    regulatory_approvals_required = Column(Boolean, default=False)
    antitrust_concerns = Column(Boolean, default=False)
    regulatory_notes = Column(Text, nullable=True)
    
    # Source and tracking
    data_source = Column(String, nullable=True)
    confidence_score = Column(Numeric(3, 2), nullable=True)  # 0-1 confidence in data accuracy
    
    # Status flags
    is_hostile = Column(Boolean, default=False)
    is_cross_border = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    acquirer = relationship("Company", foreign_keys=[acquirer_id], backref="deals_as_acquirer")
    target = relationship("Company", foreign_keys=[target_id], backref="deals_as_target")
    news_items = relationship("NewsItem", back_populates="deal", cascade="all, delete-orphan")
    ai_insights = relationship("AIInsight", back_populates="deal", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_deals_status', 'status'),
        Index('ix_deals_deal_type', 'deal_type'),
        Index('ix_deals_announced_date', 'announced_date'),
        Index('ix_deals_deal_value', 'deal_value'),
        Index('ix_deals_acquirer_id', 'acquirer_id'),
        Index('ix_deals_target_id', 'target_id'),
        Index('ix_deals_is_active', 'is_active'),
    )
