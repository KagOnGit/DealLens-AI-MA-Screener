from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def get_deals():
    """Get deals - placeholder endpoint."""
    return {"message": "Deals endpoint - to be implemented"}


@router.get("/recent")
async def get_recent_deals():
    """Get recent deals - placeholder endpoint."""
    return {
        "deals": [
            {
                "id": "1",
                "acquirer": "TechCorp Inc.",
                "target": "StartupAI Ltd.",
                "value": "$500M",
                "status": "announced",
                "date": "2024-01-15"
            },
            {
                "id": "2", 
                "acquirer": "MegaBank",
                "target": "FinTech Solutions",
                "value": "$1.2B",
                "status": "completed",
                "date": "2024-01-10"
            }
        ]
    }
