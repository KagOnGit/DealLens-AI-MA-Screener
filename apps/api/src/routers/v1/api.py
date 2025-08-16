from fastapi import APIRouter

from ..routers.companies import router as companies_router
from ..routers.deals import router as deals_router  
from ..routers.alerts import router as alerts_router
from ..routers.analytics import router as analytics_router
from .endpoints import auth

api_router = APIRouter()

api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["authentication"]
)

api_router.include_router(
    companies_router, 
    prefix="/companies", 
    tags=["companies"]
)

api_router.include_router(
    deals_router, 
    prefix="/deals", 
    tags=["deals"]
)

api_router.include_router(
    alerts_router,
    prefix="/alerts",
    tags=["alerts"]
)

api_router.include_router(
    analytics_router,
    prefix="/analytics", 
    tags=["analytics"]
)
