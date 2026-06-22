from fastapi import APIRouter
from app.api.routes import imports, engine

api_router = APIRouter()
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(engine.router, prefix="/engine", tags=["engine"])
