from sqlalchemy import Column, String, Numeric, DateTime, JSON, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, index=True)
    ticker = Column(String(10), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    sector = Column(String(100), nullable=True, index=True)
    industry = Column(String(150), nullable=True)
    market_cap = Column(Numeric(20, 2), nullable=True)
    last_price = Column(Numeric(10, 4), nullable=True)
    description = Column(Text, nullable=True)
    website = Column(String(255), nullable=True)
    headquarters = Column(String(255), nullable=True)
    employees = Column(Numeric(10, 0), nullable=True)
    founded_year = Column(Numeric(4, 0), nullable=True)
    
    # Financial ratios stored as JSON for flexibility
    ratios = Column(JSON, nullable=True)
    # Example: {"pe": 29.1, "evEbitda": 21.3, "roe": 0.54, "debtEquity": 1.5, "currentRatio": 2.1}
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    deals_as_acquirer = relationship("Deal", foreign_keys="Deal.acquirer_id", back_populates="acquirer")
    deals_as_target = relationship("Deal", foreign_keys="Deal.target_id", back_populates="target")
    watchlists = relationship("Watchlist", back_populates="company", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="company", cascade="all, delete-orphan")
    news_items = relationship("NewsItem", back_populates="company", cascade="all, delete-orphan")
    ohlc_data = relationship("OHLCData", back_populates="company", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_companies_sector', 'sector'),
        Index('ix_companies_market_cap', 'market_cap'),
        Index('ix_companies_last_price', 'last_price'),
    )


class OHLCData(Base):
    __tablename__ = "ohlc_data"
    
    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, nullable=False, index=True)
    date = Column(DateTime(timezone=True), nullable=False)
    open_price = Column(Numeric(10, 4), nullable=False)
    high_price = Column(Numeric(10, 4), nullable=False)
    low_price = Column(Numeric(10, 4), nullable=False)
    close_price = Column(Numeric(10, 4), nullable=False)
    volume = Column(Numeric(15, 0), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="ohlc_data")
    
    __table_args__ = (
        Index('ix_ohlc_company_date', 'company_id', 'date'),
    )
