from __future__ import annotations

import os
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

from .config import settings

# Declarative base
Base = declarative_base()

# Async engine & session
ASYNC_DATABASE_URL = (
    os.getenv("ASYNC_DATABASE_URL") 
    or settings.ASYNC_DATABASE_URL 
    or settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    if settings.DATABASE_URL
    else ""
)
engine = create_async_engine(ASYNC_DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session: AsyncSession = SessionLocal()
    try:
        yield session
    finally:
        await session.close()


async def init_db() -> None:
    """
    Initialize database on startup.

    Strategy is controlled by DB_INIT_STRATEGY:
      - "create"      -> create_all(checkfirst=True)
      - "alembic"     -> run Alembic upgrade if available (no-op if not)
      - "auto"/empty  -> default to "create" for now
      - "none"        -> skip
    """
    strategy = (os.getenv("DB_INIT_STRATEGY") or "auto").lower()
    if strategy == "none":
        return
    if strategy in ("auto", "create"):
        # Idempotent create: won't try to recreate existing tables/indexes
        async with engine.begin() as conn:
            await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, checkfirst=True))
        return
    if strategy == "alembic":
        # Optional: run Alembic if your project uses it.
        # We avoid failing if Alembic isn't present.
        try:
            import asyncio, subprocess
            proc = await asyncio.create_subprocess_exec(
                "alembic", "upgrade", "head",
                cwd=os.getenv("ALEmbic_CWD", "/app"),
            )
            await proc.wait()
        except Exception:
            pass
        return
