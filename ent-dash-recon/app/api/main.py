from fastapi import APIRouter
from app.api.routes import rekon

api_router = APIRouter()
api_router.include_router(rekon.router, tags=["rekon"])

