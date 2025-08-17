from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.core.config import settings

Base = declarative_base()

# async engine (expects postgresql+asyncpg in settings)
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)

async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def init_db(check_first: bool = True):
    """
    Import models and create tables if they don't exist.
    Using checkfirst=True prevents DuplicateTableError on restarts.
    """
    # Import models here so metadata is populated
    from app.models import user, company, deal  # noqa: F401

    async with engine.begin() as conn:
        # run_sync allows passing checkfirst
        def _create_all(sync_conn):
            Base.metadata.create_all(bind=sync_conn, checkfirst=check_first)
        await conn.run_sync(_create_all)
