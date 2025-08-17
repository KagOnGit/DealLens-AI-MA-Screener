from pydantic_settings import BaseSettings
from typing import Optional, List
import os
import sys
import logging


class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "DealLens AI M&A Screener API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # Security
    JWT_SECRET: str = "your-super-secret-jwt-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30  # 30 days
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Documentation
    DOCS_ENABLED: bool = True  # Set to False in production via env
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # CORS origins from environment (comma-separated)
    CORS_ORIGINS: str = "http://localhost:3000,https://localhost:3000"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/deallens"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379"
    
    # CORS (computed from CORS_ORIGINS)
    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # External APIs
    ALPHAVANTAGE_KEY: Optional[str] = None
    NEWSAPI_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()

# Validate critical settings at startup
def validate_settings():
    """Validate critical settings and fail fast if misconfigured"""
    errors = []
    
    # JWT Secret validation
    if len(settings.JWT_SECRET) < 32:
        errors.append("JWT_SECRET must be at least 32 characters long")
    
    if settings.JWT_SECRET == "your-super-secret-jwt-key-change-in-production-min-32-chars" and settings.ENVIRONMENT == "production":
        errors.append("JWT_SECRET must be changed from default value in production")
    
    # Required API keys in production
    if settings.ENVIRONMENT == "production":
        required_keys = {
            "NEWSAPI_KEY": settings.NEWSAPI_KEY,
            "ALPHAVANTAGE_KEY": settings.ALPHAVANTAGE_KEY,
            "OPENAI_API_KEY": settings.OPENAI_API_KEY,
            "DATABASE_URL": settings.DATABASE_URL,
            "REDIS_URL": settings.REDIS_URL,
        }
        
        for key_name, key_value in required_keys.items():
            if not key_value:
                errors.append(f"{key_name} is required in production environment")
    
    # Database URL validation
    if not settings.DATABASE_URL.startswith(("postgresql://", "postgres://")):
        errors.append("DATABASE_URL must be a valid PostgreSQL connection string")
    
    # Redis URL validation
    if not settings.REDIS_URL.startswith("redis://"):
        errors.append("REDIS_URL must be a valid Redis connection string")
    
    if errors:
        for error in errors:
            logging.error(f"Configuration error: {error}")
        sys.exit(1)
    
    logging.info(f"Configuration validated successfully for {settings.ENVIRONMENT} environment")


# Validate settings on import
validate_settings()
