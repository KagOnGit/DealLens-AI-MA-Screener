from .companies import router as companies_router
from .deals import router as deals_router
from .alerts import router as alerts_router
from .analytics import router as analytics_router

__all__ = [
    "companies_router",
    "deals_router", 
    "alerts_router",
    "analytics_router"
]
