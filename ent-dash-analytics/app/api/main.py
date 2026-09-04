from fastapi import APIRouter
from app.api.routes import financial, qris, tableau, scoring

api_router = APIRouter()
api_router.include_router(financial.router, prefix="/dashboard", tags=["financial"])
api_router.include_router(qris.router, prefix="/dashboard", tags=["qris"])
api_router.include_router(tableau.router, prefix="/tableau", tags=["tableau"])
api_router.include_router(scoring.router, prefix="/scoring", tags=["scoring"])
