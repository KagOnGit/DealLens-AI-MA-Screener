from sqlalchemy import Column, String, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Watchlist(Base):
    __tablename__ = "watchlists"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="watchlists")
    company = relationship("Company", back_populates="watchlists")
    
    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_user_company_watchlist'),
        Index('ix_watchlists_user', 'user_id'),
        Index('ix_watchlists_company', 'company_id'),
    )
