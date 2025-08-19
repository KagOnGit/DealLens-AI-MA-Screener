from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.sql import func
from ..core.database import Base


class SavedFilter(Base):
    __tablename__ = "saved_filters"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    kind = Column(String, nullable=False)  # comps, precedents, deals, companies
    params_json = Column(Text, nullable=False)  # JSON string of filter parameters
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_saved_filters_user', 'user_id'),
        Index('ix_saved_filters_kind', 'kind'),
        Index('ix_saved_filters_user_kind', 'user_id', 'kind'),
    )
