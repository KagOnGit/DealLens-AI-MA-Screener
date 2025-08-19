from sqlalchemy import Column, String, Integer, Numeric, DateTime, Index, Text
from sqlalchemy.sql import func
from ..core.database import Base


class PrecedentDeal(Base):
    __tablename__ = "precedent_deals"

    id = Column(Integer, primary_key=True, index=True)
    acquirer = Column(String, nullable=False)
    target = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    region = Column(String, nullable=True)
    announced_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    ev = Column(Numeric(15, 2), nullable=True)  # Enterprise Value in millions
    revenue = Column(Numeric(15, 2), nullable=True)
    ebitda = Column(Numeric(15, 2), nullable=True)
    ev_to_revenue = Column(Numeric(8, 2), nullable=True)
    ev_to_ebitda = Column(Numeric(8, 2), nullable=True)
    premium = Column(Numeric(8, 2), nullable=True)  # Premium percentage
    advisors_buy = Column(Text, nullable=True)  # JSON list of buy-side advisors
    advisors_sell = Column(Text, nullable=True)  # JSON list of sell-side advisors
    status = Column(String, nullable=False, default="announced")  # announced, closed, terminated
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_precedent_deals_sector', 'sector'),
        Index('ix_precedent_deals_region', 'region'),
        Index('ix_precedent_deals_announced', 'announced_at'),
        Index('ix_precedent_deals_closed', 'closed_at'),
        Index('ix_precedent_deals_ev', 'ev'),
        Index('ix_precedent_deals_status', 'status'),
    )
