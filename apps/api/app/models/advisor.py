from sqlalchemy import Column, String, Integer, Index
from sqlalchemy.orm import relationship
from ..core.database import Base


class Advisor(Base):
    __tablename__ = "advisors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)

    # Relationships
    stats = relationship("AdvisorStat", back_populates="advisor")
    
    # Indexes
    __table_args__ = (
        Index('ix_advisors_name', 'name'),
    )
