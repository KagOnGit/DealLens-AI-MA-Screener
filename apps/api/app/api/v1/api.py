from fastapi import APIRouter

from .endpoints import companies, deals, dashboard, auth, search, alerts, debug
from .endpoints import comps, precedents, league_tables, valuation, market, filings, pipeline, pitches, collab, tearsheets, saved

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

# Investment Banking endpoints
api_router.include_router(
    comps.router,
    prefix="/comps",
    tags=["comps"]
)

api_router.include_router(
    precedents.router,
    prefix="/precedents",
    tags=["precedents"]
)

api_router.include_router(
    league_tables.router,
    prefix="/league-tables",
    tags=["league-tables"]
)

api_router.include_router(
    valuation.router,
    prefix="/valuation",
    tags=["valuation"]
)

api_router.include_router(
    market.router,
    prefix="/market",
    tags=["market"]
)

api_router.include_router(
    filings.router,
    prefix="/filings",
    tags=["filings"]
)

api_router.include_router(
    pipeline.router,
    prefix="/pipeline",
    tags=["pipeline"]
)

api_router.include_router(
    pitches.router,
    prefix="/pitches",
    tags=["pitches"]
)

api_router.include_router(
    collab.router,
    prefix="/collab",
    tags=["collaboration"]
)

api_router.include_router(
    tearsheets.router,
    prefix="/tearsheets",
    tags=["tearsheets"]
)

api_router.include_router(
    saved.router,
    prefix="/saved",
    tags=["saved"]
)
