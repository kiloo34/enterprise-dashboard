from fastapi import APIRouter
from app.api.routes import auth, users, rbac, user_management, dashboard, engine

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/user", tags=["user"])
api_router.include_router(rbac.router, tags=["rbac"])
api_router.include_router(user_management.router, tags=["user-management"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(engine.router, prefix="/engine", tags=["engine"])

