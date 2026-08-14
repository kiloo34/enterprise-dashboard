from fastapi import APIRouter

from app.api.routes import engine as engine_router

api_router = APIRouter()

api_router.include_router(engine_router.router, prefix="/engine", tags=["engine"])


@api_router.get("/status")
async def health_check():
    return {"status": "ok", "service": "ent-dash-dw"}
