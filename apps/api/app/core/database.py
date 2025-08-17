from __future__ import annotations
import os
from typing import AsyncGenerator, Generator
from contextlib import asynccontextmanager
from sqlalchemy import text, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase


class Base(DeclarativeBase):
    pass

from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL or "postgresql://localhost/deallens_dev"

def _derive_async(url: str) -> str:
    if url.startswith("postgresql+asyncpg://"):
        return url
    if url.startswith("postgresql://"):
        return url.replace("postgresql://","postgresql+asyncpg://",1)
    return url

ASYNC_DATABASE_URL = _derive_async(os.getenv("ASYNC_DATABASE_URL","").strip() or DATABASE_URL)

# Only create engines if we have a valid URL
if DATABASE_URL and DATABASE_URL != "postgresql://localhost/deallens_dev":
    sync_engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    SessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False, class_=Session)
    
    async_engine = create_async_engine(ASYNC_DATABASE_URL, pool_pre_ping=True)
    AsyncSessionLocal = async_sessionmaker(bind=async_engine, expire_on_commit=False, class_=AsyncSession)
else:
    # Placeholder engines for development/testing
    sync_engine = None
    SessionLocal = None
    async_engine = None
    AsyncSessionLocal = None

def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("Database not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@asynccontextmanager
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise RuntimeError("Async database not configured")
    async with AsyncSessionLocal() as s:
        yield s

async def init_db() -> None:
    # connectivity check only; no create_all to avoid duplicate index errors
    if async_engine is None:
        raise RuntimeError("Async database engine not configured")
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        raise RuntimeError(f"DB connectivity failed: {e}") from e

# Backward compatibility alias
async_session_maker = AsyncSessionLocal

__all__ = [
    "DATABASE_URL","ASYNC_DATABASE_URL",
    "Base",
    "sync_engine","async_engine",
    "SessionLocal","AsyncSessionLocal", "async_session_maker",
    "get_db","get_async_session","init_db",
]
