# apps/api/app/api/v1/endpoints/companies.py
from fastapi import APIRouter

# Minimal router placeholder to avoid import crashes.
# Actual endpoints can be (re)implemented later; keeping it empty
# ensures FastAPI can import the module cleanly at startup.
router = APIRouter(tags=["companies"])

# Example (keep commented until models/services are stable):
# @router.get("/companies")
# def list_companies():
#     return {"items": [], "total": 0, "page": 1, "page_size": 20, "total_pages": 0}
