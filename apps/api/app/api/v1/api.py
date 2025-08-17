from fastapi import APIRouter

from .endpoints import companies, deals, dashboard, auth, search, alerts, debug

api_router = APIRouter()

api_router.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["authentication"]
)

# Company endpoints with proper routing
api_router.include_router(
    companies.router, 
    tags=["companies"]
)

# Deals endpoints with proper routing
api_router.include_router(
    deals.router, 
    tags=["deals"]
)

api_router.include_router(
    dashboard.router, 
    prefix="/dashboard", 
    tags=["dashboard"]
)

# Search endpoints
api_router.include_router(
    search.router,
    tags=["search"]
)

api_router.include_router(
    alerts.router,
    prefix="/alerts",
    tags=["alerts"]
)

# Debug endpoints
api_router.include_router(
    debug.router,
    tags=["debug"]
)
