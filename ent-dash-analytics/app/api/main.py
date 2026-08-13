from fastapi import APIRouter
from app.api.routes import financial, qris, tableau

api_router = APIRouter()
api_router.include_router(financial.router, prefix="/dashboard", tags=["financial"])
api_router.include_router(qris.router, prefix="/dashboard", tags=["qris"])
api_router.include_router(tableau.router, prefix="/tableau", tags=["tableau"])

