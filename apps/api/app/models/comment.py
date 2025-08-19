from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from sqlalchemy.sql import func
from ..core.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False)  # company, deal, pitch
    entity_id = Column(String, nullable=False)
    author = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Indexes
    __table_args__ = (
        Index('ix_comments_entity', 'entity_type', 'entity_id'),
        Index('ix_comments_author', 'author'),
        Index('ix_comments_created_at', 'created_at'),
    )
