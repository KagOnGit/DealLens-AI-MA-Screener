from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.sql import func
from ..core.database import Base


class SavedDashboard(Base):
    __tablename__ = "saved_dashboards"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    name = Column(String, nullable=False)
    widgets_json = Column(Text, nullable=False)  # JSON string of dashboard widgets/layout
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_saved_dashboards_user', 'user_id'),
    )
