try:
    from app.observability import sentry  # noqa: F401
except Exception:
    pass
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.config import settings

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

# Rate limiting setup
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_GENERAL, settings.RATE_LIMIT_BURST])
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def ratelimit_handler(request, exc):
    return JSONResponse(status_code=429, content={"detail": "Too Many Requests"})

# Configure CORS with proper settings
logger.info(f"CORS allowed origins: {settings.ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS or ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
try:
    from app.api.v1.api import api_router
    app.include_router(api_router, prefix="/api/v1")
except Exception as e:
    logger.error("Router include failed: %s", e)

# Health endpoints (exempt from rate limiting)
@app.get("/status")
@limiter.exempt
async def api_status():
    return {"status": "ok", "service": "api"}

@app.get("/healthz")
@limiter.exempt
async def healthz():
    return {"status": "ok"}

@app.get("/readyz")
@limiter.exempt
async def readyz():
    try:
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import text
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ready"}
    except Exception as e:
        return {"status": "not_ready", "error": str(e)}
