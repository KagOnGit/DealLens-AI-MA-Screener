from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Be tolerant: don't crash app if DB create_all finds existing objects or DB is cold
    try:
        from app.core.database import init_db
        await init_db()
        logger.info("DB init OK")
    except Exception as e:
        logger.warning("DB init warning (continuing): %s", e)
    yield
    # optional cleanup

app = FastAPI(lifespan=lifespan)

# Routers
try:
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix="/api/v1")
except Exception as e:
    logger.error("Router include failed: %s", e)

# Health endpoints
@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/readyz")
async def readyz():
    try:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "error": str(e)}
