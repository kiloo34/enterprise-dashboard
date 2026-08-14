from fastapi import APIRouter
from app.api.routes import imports, notifications

api_router = APIRouter()
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(notifications.router, prefix="/engine", tags=["notifications"])

