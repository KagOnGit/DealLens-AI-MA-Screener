from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import List, Optional
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default=os.getenv("ENVIRONMENT", "production"))
    DEBUG: bool = Field(default=str(os.getenv("DEBUG", "false")).lower() == "true")

    # DB
    DATABASE_URL: str = Field(default=os.getenv("DATABASE_URL", ""))

    # Redis / Celery
    REDIS_URL: str = Field(default=os.getenv("REDIS_URL", ""))
    CELERY_BROKER_URL: str = Field(default=os.getenv("CELERY_BROKER_URL", ""))
    CELERY_RESULT_BACKEND: str = Field(default=os.getenv("CELERY_RESULT_BACKEND", ""))

    # Auth
    JWT_SECRET: str = Field(default=os.getenv("JWT_SECRET", "change-me-in-prod-min-32-chars"))
    JWT_ALGORITHM: str = Field(default=os.getenv("JWT_ALGORITHM", "HS256"))
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")))
    REFRESH_TOKEN_EXPIRE_MINUTES: int = Field(default=int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 14))))

    # Rate limiting
    RATE_LIMIT_GENERAL: str = Field(default=os.getenv("RATE_LIMIT_GENERAL", "100/minute"))
    RATE_LIMIT_AUTH: str = Field(default=os.getenv("RATE_LIMIT_AUTH", "10/minute"))
    RATE_LIMIT_BURST: str = Field(default=os.getenv("RATE_LIMIT_BURST", "20/10second"))

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(default=[])

    # External APIs
    NEWSAPI_KEY: str = Field(default=os.getenv("NEWSAPI_KEY", ""))
    ALPHAVANTAGE_KEY: str = Field(default=os.getenv("ALPHAVANTAGE_KEY", ""))
    OPENAI_API_KEY: str = Field(default=os.getenv("OPENAI_API_KEY", ""))
    OPENAI_MODEL: str = Field(default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    class Config:
        extra = "ignore"

settings = Settings()

# Normalize to async driver if needed
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
