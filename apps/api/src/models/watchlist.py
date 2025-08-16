from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Watchlist metadata
    added_reason = Column(Text, nullable=True)  # Why user added this company
    target_price = Column(String, nullable=True)  # User's target price for alerts
    notes = Column(Text, nullable=True)  # User's private notes
    
    # Notification preferences
    price_alerts_enabled = Column(Boolean, default=True)
    news_alerts_enabled = Column(Boolean, default=True)
    ma_alerts_enabled = Column(Boolean, default=True)  # M&A activity alerts
    earnings_alerts_enabled = Column(Boolean, default=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="watchlist")
    company = relationship("Company", backref="watchers")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_user_company_watchlist'),
        Index('ix_watchlists_user_id', 'user_id'),
        Index('ix_watchlists_company_id', 'company_id'),
        Index('ix_watchlists_is_active', 'is_active'),
    )
