from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)
    ticker = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    country = Column(String, nullable=True)
    market_cap = Column(Numeric(15, 2), nullable=True)
    employees = Column(Integer, nullable=True)
    founded_year = Column(Integer, nullable=True)
    website = Column(String, nullable=True)
    headquarters = Column(String, nullable=True)
    is_public = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships (will be defined when other models are created)
    # financial_metrics = relationship("FinancialMetric", back_populates="company")
    # deals = relationship("Deal", back_populates="acquirer")
    # deals_as_target = relationship("Deal", back_populates="target")
    # market_data = relationship("MarketData", back_populates="company")

    # Indexes
    __table_args__ = (
        Index('ix_companies_industry', 'industry'),
        Index('ix_companies_sector', 'sector'),
        Index('ix_companies_market_cap', 'market_cap'),
    )
