from fastapi import APIRouter

from .endpoints import companies, deals, dashboard, auth

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
