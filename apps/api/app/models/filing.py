from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.sql import func
from ..core.database import Base


class Filing(Base):
    __tablename__ = "filings"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 10-K, 10-Q, 8-K, etc.
    filed_at = Column(DateTime, nullable=False)
    url = Column(String, nullable=True)
    title = Column(String, nullable=True)
    highlights_json = Column(Text, nullable=True)  # JSON string of key highlights
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_filings_ticker', 'ticker'),
        Index('ix_filings_type', 'type'),
        Index('ix_filings_filed_at', 'filed_at'),
        Index('ix_filings_ticker_type', 'ticker', 'type'),
    )
