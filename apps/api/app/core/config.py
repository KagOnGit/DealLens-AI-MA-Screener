from pydantic_settings import BaseSettings
from pydantic import Field
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
    JWT_SECRET: str = Field(default=os.getenv("JWT_SECRET", "change-me-please-32-chars-min"))

    # External APIs
    NEWSAPI_KEY: str = Field(default=os.getenv("NEWSAPI_KEY", ""))
    ALPHAVANTAGE_KEY: str = Field(default=os.getenv("ALPHAVANTAGE_KEY", ""))
    OPENAI_API_KEY: str = Field(default=os.getenv("OPENAI_API_KEY", ""))
    OPENAI_MODEL: str = Field(default=os.getenv("OPENAI_MODEL", "gpt-4o-mini"))

    class Config:
        extra = "ignore"

settings = Settings()

# Normalize to async driver if needed
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgresql://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
