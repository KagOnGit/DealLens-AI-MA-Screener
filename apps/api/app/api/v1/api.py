from fastapi import APIRouter

from .endpoints import companies, deals, dashboard, auth, search, alerts

api_router = APIRouter()

api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["authentication"]
)

api_router.include_router(
    companies.router, 
    prefix="/companies", 
    tags=["companies"]
)

api_router.include_router(
    deals.router, 
    prefix="/deals", 
    tags=["deals"]
)

api_router.include_router(
    dashboard.router, 
    prefix="/dashboard", 
    tags=["dashboard"]
)

api_router.include_router(
    search.router,
    tags=["search"]
)

api_router.include_router(
    alerts.router,
    tags=["alerts"]
)
