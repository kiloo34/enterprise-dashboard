from fastapi import APIRouter
from app.api.routes import auth, users, rbac, user_management, admin, system_config, positions, org_units, audit, compliance, translations, navigation

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/user", tags=["user"])
api_router.include_router(rbac.router, tags=["rbac"])
api_router.include_router(user_management.router, tags=["user-management"])
api_router.include_router(positions.router, prefix="/positions", tags=["positions"])
api_router.include_router(org_units.router, prefix="/organization-units", tags=["organization-units"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(system_config.router, prefix="/system-config", tags=["system-config"])
api_router.include_router(translations.router, prefix="/translations", tags=["translations"])
api_router.include_router(audit.router, tags=["audit"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["compliance"])
api_router.include_router(navigation.router, prefix="/navigation", tags=["navigation"])
