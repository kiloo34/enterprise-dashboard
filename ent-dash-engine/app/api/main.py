from fastapi import APIRouter
from app.api.routes import imports, engine, notifications, data_explorer

api_router = APIRouter()
api_router.include_router(imports.router, prefix="/imports", tags=["imports"])
api_router.include_router(engine.router, prefix="/engine", tags=["engine"])
api_router.include_router(notifications.router, prefix="/engine", tags=["notifications"])
api_router.include_router(data_explorer.router, prefix="/engine/explorer", tags=["data-explorer"])

