from sqlalchemy import Column, String, Integer, Boolean, DateTime, Numeric, Text, ForeignKey, Index, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class InstitutionalOwnership(Base):
    __tablename__ = "institutional_ownership"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Holder information
    holder_name = Column(String, nullable=False)
    holder_type = Column(String, nullable=True)  # 'institutional', 'mutual_fund', 'etf', 'insider'
    
    # Ownership details
    shares_held = Column(Integer, nullable=False)
    percentage_owned = Column(Numeric(5, 2), nullable=False)
    market_value = Column(Numeric(15, 2), nullable=True)
    
    # Reporting period
    report_date = Column(Date, nullable=False)
    filing_date = Column(Date, nullable=True)
    
    # Change tracking
    shares_change = Column(Integer, nullable=True)
    percentage_change = Column(Numeric(5, 2), nullable=True)
    
    # Data source
    data_source = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="ownership_data")
    
    # Indexes
    __table_args__ = (
        Index('ix_institutional_ownership_company_id', 'company_id'),
        Index('ix_institutional_ownership_report_date', 'report_date'),
        Index('ix_institutional_ownership_company_report', 'company_id', 'report_date'),
        Index('ix_institutional_ownership_holder_name', 'holder_name'),
    )


class InsiderTransaction(Base):
    __tablename__ = "insider_transactions"

    id = Column(String, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    
    # Insider information
    insider_name = Column(String, nullable=False)
    insider_title = Column(String, nullable=True)
    insider_relationship = Column(String, nullable=True)  # 'Officer', 'Director', 'Beneficial Owner'
    
    # Transaction details
    transaction_date = Column(Date, nullable=False)
    transaction_type = Column(String, nullable=False)  # 'Buy', 'Sell', 'Option Exercise', etc.
    shares_transacted = Column(Integer, nullable=False)
    transaction_price = Column(Numeric(10, 4), nullable=True)
    transaction_value = Column(Numeric(15, 2), nullable=True)
    
    # Holdings after transaction
    shares_owned_after = Column(Integer, nullable=True)
    
    # Filing information
    filing_date = Column(Date, nullable=True)
    form_type = Column(String, nullable=True)  # '4', '3', '5', etc.
    
    # Data source
    data_source = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    company = relationship("Company", backref="insider_transactions")
    
    # Indexes
    __table_args__ = (
        Index('ix_insider_transactions_company_id', 'company_id'),
        Index('ix_insider_transactions_transaction_date', 'transaction_date'),
        Index('ix_insider_transactions_insider_name', 'insider_name'),
        Index('ix_insider_transactions_transaction_type', 'transaction_type'),
    )


class DealTimeline(Base):
    __tablename__ = "deal_timeline"

    id = Column(String, primary_key=True, index=True)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False)
    
    # Timeline event details
    event_date = Column(Date, nullable=False)
    event_type = Column(String, nullable=False)  # 'Announcement', 'Regulatory', 'Shareholder', 'Closing', etc.
    event_title = Column(String, nullable=False)
    event_description = Column(Text, nullable=True)
    
    # Status
    status = Column(String, default='completed')  # 'completed', 'pending', 'cancelled'
    
    # Importance and categorization
    importance_level = Column(String, default='medium')  # 'low', 'medium', 'high', 'critical'
    is_milestone = Column(Boolean, default=False)
    
    # Source and data quality
    data_source = Column(String, nullable=True)
    confidence_score = Column(Numeric(3, 2), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    deal = relationship("Deal", backref="timeline_events")
    
    # Indexes
    __table_args__ = (
        Index('ix_deal_timeline_deal_id', 'deal_id'),
        Index('ix_deal_timeline_event_date', 'event_date'),
        Index('ix_deal_timeline_event_type', 'event_type'),
        Index('ix_deal_timeline_is_milestone', 'is_milestone'),
    )
