from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class NewsItem(Base):
    __tablename__ = "news_items"

    id = Column(String, primary_key=True, index=True)
    ticker = Column(String(10), ForeignKey("companies.ticker"), nullable=True, index=True)  
    deal_id = Column(String, ForeignKey("deals.id"), nullable=True, index=True)
    
    # News content
    title = Column(String(500), nullable=False)
    url = Column(String(1000), nullable=False)
    source = Column(String(100), nullable=True, index=True)
    summary = Column(Text, nullable=True)
    
    # Publication info
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    
    # Content analysis
    sentiment_score = Column(String(20), nullable=True)  # "positive", "negative", "neutral"
    relevance_score = Column(String(10, 2), nullable=True)  # 0.0 to 1.0
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", back_populates="news_items")
    deal = relationship("Deal", back_populates="news_items")
    
    # Indexes
    __table_args__ = (
        Index('ix_news_ticker_published', 'ticker', 'published_at'),
        Index('ix_news_deal_published', 'deal_id', 'published_at'),
        Index('ix_news_source_published', 'source', 'published_at'),
    )
