from sqlalchemy import Column, String, Integer, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class AdvisorStat(Base):
    __tablename__ = "advisor_stats"

    id = Column(Integer, primary_key=True, index=True)
    advisor_id = Column(Integer, ForeignKey("advisors.id"), nullable=False)
    period = Column(String, nullable=False)  # Q1-2024, 2024, etc.
    total_value = Column(Numeric(15, 2), nullable=False, default=0)
    deal_count = Column(Integer, nullable=False, default=0)
    sector = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    advisor = relationship("Advisor", back_populates="stats")
    
    # Indexes
    __table_args__ = (
        Index('ix_advisor_stats_advisor_period', 'advisor_id', 'period'),
        Index('ix_advisor_stats_period', 'period'),
        Index('ix_advisor_stats_sector', 'sector'),
    )
