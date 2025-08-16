from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, Text, ForeignKey, Index, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Price data
    date = Column(Date, nullable=False)
    open_price = Column(Numeric(10, 4), nullable=True)
    high_price = Column(Numeric(10, 4), nullable=True)
    low_price = Column(Numeric(10, 4), nullable=True)
    close_price = Column(Numeric(10, 4), nullable=False)
    adjusted_close = Column(Numeric(10, 4), nullable=True)
    
    # Volume data
    volume = Column(Integer, nullable=True)
    dollar_volume = Column(Numeric(15, 2), nullable=True)
    
    # Technical indicators (calculated)
    sma_20 = Column(Numeric(10, 4), nullable=True)  # 20-day simple moving average
    sma_50 = Column(Numeric(10, 4), nullable=True)  # 50-day simple moving average
    sma_200 = Column(Numeric(10, 4), nullable=True)  # 200-day simple moving average
    rsi = Column(Numeric(5, 2), nullable=True)  # Relative Strength Index
    
    # Market metrics
    market_cap = Column(Numeric(15, 2), nullable=True)
    shares_outstanding = Column(Integer, nullable=True)
    
    # Data quality and source
    data_source = Column(String, nullable=True)
    is_adjusted = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="market_data")
    
    # Indexes and constraints
    __table_args__ = (
        Index('ix_market_data_company_id', 'company_id'),
        Index('ix_market_data_date', 'date'),
        Index('ix_market_data_company_date', 'company_id', 'date'),
    )


class FinancialMetric(Base):
    __tablename__ = "financial_metrics"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Reporting period
    period_end_date = Column(Date, nullable=False)
    period_type = Column(String, nullable=False)  # 'quarterly', 'annual'
    fiscal_year = Column(Integer, nullable=False)
    fiscal_quarter = Column(Integer, nullable=True)  # 1-4, null for annual
    
    # Income Statement
    revenue = Column(Numeric(15, 2), nullable=True)
    gross_profit = Column(Numeric(15, 2), nullable=True)
    operating_income = Column(Numeric(15, 2), nullable=True)
    ebitda = Column(Numeric(15, 2), nullable=True)
    net_income = Column(Numeric(15, 2), nullable=True)
    eps_basic = Column(Numeric(8, 4), nullable=True)
    eps_diluted = Column(Numeric(8, 4), nullable=True)
    
    # Balance Sheet
    total_assets = Column(Numeric(15, 2), nullable=True)
    total_debt = Column(Numeric(15, 2), nullable=True)
    total_equity = Column(Numeric(15, 2), nullable=True)
    cash_and_equivalents = Column(Numeric(15, 2), nullable=True)
    working_capital = Column(Numeric(15, 2), nullable=True)
    
    # Cash Flow
    operating_cash_flow = Column(Numeric(15, 2), nullable=True)
    free_cash_flow = Column(Numeric(15, 2), nullable=True)
    capex = Column(Numeric(15, 2), nullable=True)
    
    # Financial Ratios (calculated)
    pe_ratio = Column(Numeric(8, 2), nullable=True)
    pb_ratio = Column(Numeric(8, 2), nullable=True)
    debt_to_equity = Column(Numeric(8, 2), nullable=True)
    current_ratio = Column(Numeric(8, 2), nullable=True)
    roe = Column(Numeric(8, 2), nullable=True)  # Return on Equity
    roa = Column(Numeric(8, 2), nullable=True)  # Return on Assets
    gross_margin = Column(Numeric(8, 2), nullable=True)
    operating_margin = Column(Numeric(8, 2), nullable=True)
    net_margin = Column(Numeric(8, 2), nullable=True)
    
    # Data quality
    data_source = Column(String, nullable=True)
    is_estimated = Column(Boolean, default=False)
    confidence_score = Column(Numeric(3, 2), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="financial_metrics")
    
    # Indexes
    __table_args__ = (
        Index('ix_financial_metrics_company_id', 'company_id'),
        Index('ix_financial_metrics_period_end', 'period_end_date'),
        Index('ix_financial_metrics_company_period', 'company_id', 'period_end_date'),
        Index('ix_financial_metrics_fiscal_year', 'fiscal_year'),
    )


class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=True)
    
    # News content
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    
    # Publication details
    source = Column(String, nullable=True)  # e.g., "Reuters", "Bloomberg"
    author = Column(String, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Categorization
    category = Column(String, nullable=True)  # e.g., "M&A", "Earnings", "Regulatory"
    tags = Column(String, nullable=True)  # Comma-separated tags
    
    # Sentiment analysis
    sentiment_score = Column(Numeric(3, 2), nullable=True)  # -1 to 1
    sentiment_label = Column(String, nullable=True)  # positive, negative, neutral
    
    # Relevance and impact
    relevance_score = Column(Numeric(3, 2), nullable=True)  # 0-1
    impact_score = Column(Numeric(3, 2), nullable=True)  # 0-1
    
    # Data quality
    is_duplicate = Column(Boolean, default=False)
    duplicate_of = Column(String, ForeignKey("news_items.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="news_items")
    deal = relationship("Deal", back_populates="news_items")
    
    # Indexes
    __table_args__ = (
        Index('ix_news_items_company_id', 'company_id'),
        Index('ix_news_items_deal_id', 'deal_id'),
        Index('ix_news_items_published_at', 'published_at'),
        Index('ix_news_items_source', 'source'),
        Index('ix_news_items_category', 'category'),
        Index('ix_news_items_sentiment_score', 'sentiment_score'),
    )
