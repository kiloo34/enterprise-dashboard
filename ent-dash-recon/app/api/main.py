from fastapi import APIRouter
from app.api.routes import imports

api_router = APIRouter()
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])

