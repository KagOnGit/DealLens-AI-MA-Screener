from sqlalchemy import Column, String, Integer, Numeric, DateTime, Index
from sqlalchemy.sql import func
from ..core.database import Base


class Rumor(Base):
    __tablename__ = "rumors"

    id = Column(Integer, primary_key=True, index=True)
    subject_ticker = Column(String, nullable=False)
    counterparty = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    confidence = Column(Numeric(3, 2), nullable=False, default=0.5)  # 0.0 to 1.0
    source = Column(String, nullable=True)
    url = Column(String, nullable=True)
    noted_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_rumors_subject', 'subject_ticker'),
        Index('ix_rumors_sector', 'sector'),
        Index('ix_rumors_confidence', 'confidence'),
        Index('ix_rumors_noted_at', 'noted_at'),
    )
