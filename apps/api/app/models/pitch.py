from sqlalchemy import Column, String, Integer, Numeric, DateTime, Text, Index
from sqlalchemy.sql import func
from ..core.database import Base


class Pitch(Base):
    __tablename__ = "pitches"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    sector = Column(String, nullable=True)
    stage = Column(String, nullable=False, default="idea")  # idea, pitch, mandate, won, lost
    probability = Column(Numeric(3, 2), nullable=False, default=0.25)  # 0.0 to 1.0
    value = Column(Numeric(15, 2), nullable=True)  # Expected deal value in millions
    owner = Column(String, nullable=True)  # Team member responsible
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_pitches_sector', 'sector'),
        Index('ix_pitches_stage', 'stage'),
        Index('ix_pitches_owner', 'owner'),
        Index('ix_pitches_probability', 'probability'),
    )
