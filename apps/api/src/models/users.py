from sqlalchemy import Column, String, Boolean, DateTime, JSON, Index, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile information
    organization = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    phone_number = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    
    # User preferences
    theme = Column(String(20), default="dark")  # "dark", "light"
    timezone = Column(String(50), default="UTC")
    currency = Column(String(10), default="USD")
    language = Column(String(10), default="en")
    
    # API keys (encrypted/masked)
    api_keys = Column(JSON, nullable=True)  
    # Example: {"alphavantage": "****", "newsapi": "****", "openai": "****"}
    
    # Account status
    is_active = Column(Boolean, default=True, index=True)
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    watchlists = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="user", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('ix_users_active', 'is_active'),
        Index('ix_users_premium', 'is_premium'),
        Index('ix_users_created', 'created_at'),
    )
