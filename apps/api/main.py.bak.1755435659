from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uuid
import time
import logging
import sys
from datetime import datetime

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import setup_logging
from app.core.metrics import get_metrics_response
from app.api.v1.api import api_router
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.rate_limit import RateLimitMiddleware

# Setup logging first
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, 'request_id', 'unknown')
    logger.error(f"Global exception [{request_id}]: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# Add middleware in correct order (request ID first, then rate limiting)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=100, window_seconds=60)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }


@app.get("/healthz")
async def health_check():
    """Fast health check endpoint"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "deallens-api",
        "version": settings.VERSION
    }


@app.get("/readyz")
async def readiness_check():
    """Readiness check with dependency validation"""
    try:
        # TODO: Add actual DB and Redis connection checks
        # For now, return success if we reach this point
        return {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "checks": {
                "database": "ok",  # TODO: Implement actual DB check
                "redis": "ok",     # TODO: Implement actual Redis check
            }
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service not ready: {str(e)}")


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint (optional)"""
    metrics_enabled = getattr(settings, 'METRICS_ENABLED', False)
    if not metrics_enabled:
        raise HTTPException(status_code=404, detail="Metrics endpoint disabled")
    
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(get_metrics_response(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
