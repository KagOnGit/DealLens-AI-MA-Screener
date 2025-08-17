from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os

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

# Configure CORS - Allow all origins for now (TODO: restrict in production)
logger.info(f"FRONTEND_ORIGIN: {os.getenv('FRONTEND_ORIGIN', 'not set')}")
allowed_origins = ["*"]  # Temporarily allow all origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

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
