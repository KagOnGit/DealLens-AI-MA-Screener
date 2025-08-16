from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Enum, Numeric, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class AlertType(enum.Enum):
    PRICE_ABOVE = "priceAbove"
    PRICE_BELOW = "priceBelow"
    PCT_MOVE = "pctMove"
    VOLUME_SPIKE = "volumeSpike"
    NEWS_KEYWORD = "newsKeyword"
    EARNINGS = "earnings"
    MA_ACTIVITY = "maActivity"


class AlertSeverity(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(enum.Enum):
    ACTIVE = "active"
    TRIGGERED = "triggered"
    PAUSED = "paused"
    EXPIRED = "expired"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    ticker = Column(String(10), nullable=True, index=True)  # Can be null for general alerts
    
    # Alert configuration
    type = Column(Enum(AlertType), nullable=False, index=True)
    threshold_num = Column(Numeric(15, 4), nullable=True)  # Numeric threshold (price, percentage, etc.)
    threshold_text = Column(String(255), nullable=True)  # Text threshold (keywords, etc.)
    
    # Alert state
    status = Column(Enum(AlertStatus), default=AlertStatus.ACTIVE, index=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM)
    
    # User interaction
    read = Column(Boolean, default=False, index=True)
    dismissed = Column(Boolean, default=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Alert details
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    
    # Trigger information
    triggered_at = Column(DateTime(timezone=True), nullable=True, index=True)
    trigger_value = Column(Numeric(15, 4), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="alerts")
    company = relationship("Company", back_populates="alerts", primaryjoin="Alert.ticker == Company.ticker")
    
    # Indexes
    __table_args__ = (
        Index('ix_alerts_user_type', 'user_id', 'type'),
        Index('ix_alerts_ticker_type', 'ticker', 'type'),
        Index('ix_alerts_status_read', 'status', 'read'),
        Index('ix_alerts_created', 'created_at'),
    )
