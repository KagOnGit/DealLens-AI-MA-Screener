from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey, Index, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class DealStatus(enum.Enum):
    ANNOUNCED = "Announced"
    PENDING = "Pending"
    COMPLETED = "Completed"
    TERMINATED = "Terminated"


class PaymentType(enum.Enum):
    CASH = "Cash"
    STOCK = "Stock"
    CASH_STOCK = "Cash/Stock"
    OTHER = "Other"


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String, primary_key=True, index=True)
    acquirer_id = Column(String, ForeignKey("companies.id"), nullable=False)
    target_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Deal terms
    value_usd = Column(Numeric(20, 2), nullable=True)
    premium_pct = Column(Numeric(5, 2), nullable=True)
    payment_type = Column(Enum(PaymentType), nullable=True)
    synergies_usd = Column(Numeric(15, 2), nullable=True)
    
    # Status and timeline
    status = Column(Enum(DealStatus), default=DealStatus.ANNOUNCED, index=True)
    announced_at = Column(DateTime(timezone=True), nullable=True, index=True)
    expected_close_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    terminated_at = Column(DateTime(timezone=True), nullable=True)
    
    # Deal description and rationale
    title = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    strategic_rationale = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    acquirer = relationship("Company", foreign_keys=[acquirer_id], back_populates="deals_as_acquirer")
    target = relationship("Company", foreign_keys=[target_id], back_populates="deals_as_target")
    milestones = relationship("DealMilestone", back_populates="deal", cascade="all, delete-orphan")
    news_items = relationship("NewsItem", back_populates="deal", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_deals_acquirer', 'acquirer_id'),
        Index('ix_deals_target', 'target_id'),
        Index('ix_deals_value', 'value_usd'),
        Index('ix_deals_announced', 'announced_at'),
    )


class DealMilestone(Base):
    __tablename__ = "deal_milestones"
    
    id = Column(String, primary_key=True, index=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    label = Column(String(100), nullable=False)  # e.g., "Announced", "DOJ Review", "Closed"
    date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    deal = relationship("Deal", back_populates="milestones")
    
    __table_args__ = (
        Index('ix_deal_milestones_deal', 'deal_id'),
        Index('ix_deal_milestones_date', 'date'),
    )
