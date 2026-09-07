from fastapi import APIRouter

from app.api.routes import engine as engine_router
from app.api.routes import data_explorer as data_explorer_router
from app.api.routes import data_dictionary as data_dictionary_router

api_router = APIRouter()

api_router.include_router(engine_router.router, prefix="/engine", tags=["engine"])
api_router.include_router(data_explorer_router.router, prefix="/engine/explorer", tags=["data_explorer"])
api_router.include_router(data_dictionary_router.router, prefix="/dictionary", tags=["data_dictionary"])


@api_router.get("/status")
async def health_check():
    return {"status": "ok", "service": "ent-dash-dw"}
