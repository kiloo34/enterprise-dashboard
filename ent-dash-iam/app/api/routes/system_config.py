"""
System Configuration API Routes.

All endpoints require authentication.
Write endpoints (PUT, POST) are restricted to users with the 'super-admin' role.
"""
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.crud.crud_system_config import system_config as crud
from app.schemas.system_config import (
    SystemConfigResponse,
    SystemConfigUpdate,
    SystemConfigBulkUpdate,
)
from app.services.config_service import config_service
from app.core.exceptions import NotFoundException, AppException

router = APIRouter()


def _require_superadmin(current_user: User):
    """Raise 403 if the user is not a super-admin."""
    roles = [r.name for r in (current_user.roles or [])]
    if "super-admin" not in roles:
        raise AppException(
            code="FORBIDDEN",
            message="Only super-admin can manage system configuration.",
            status_code=status.HTTP_403_FORBIDDEN,
        )


def _serialise(cfg) -> dict:
    """Mask sensitive values before returning to client."""
    data = SystemConfigResponse.model_validate(cfg).model_dump()
    if cfg.is_sensitive:
        data["value"] = "••••••••"
    return data


# ── Read (any authenticated user) ────────────────────────────────────────────

@router.get("", response_model=List[SystemConfigResponse])
async def list_configs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return all system configuration entries."""
    configs = await crud.get_all(db)
    return [_serialise(c) for c in configs]


@router.get("/{key:path}", response_model=SystemConfigResponse)
async def get_config(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Return a single configuration entry by key."""
    cfg = await crud.get_by_key(db, key=key)
    if not cfg:
        raise NotFoundException(message=f"Config key '{key}' not found.", code="CONFIG_NOT_FOUND")
    return _serialise(cfg)


# ── Write (super-admin only) ──────────────────────────────────────────────────

@router.put("/{key:path}", response_model=SystemConfigResponse)
async def update_config(
    key: str,
    body: SystemConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update a single configuration value."""
    _require_superadmin(current_user)

    cfg = await crud.get_by_key(db, key=key)
    if not cfg:
        raise NotFoundException(message=f"Config key '{key}' not found.", code="CONFIG_NOT_FOUND")
    if not cfg.is_editable:
        raise AppException(
            code="CONFIG_NOT_EDITABLE",
            message=f"Config key '{key}' is read-only.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    updated = await crud.upsert(db, key=key, value=body.value, updated_by=current_user.email)
    # Immediately refresh in-memory cache for this key
    config_service.set(key, body.value)
    return _serialise(updated)


@router.put("", response_model=List[SystemConfigResponse])
async def bulk_update_configs(
    body: SystemConfigBulkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Update multiple configuration values in one request."""
    _require_superadmin(current_user)

    items = [{"key": i.key, "value": i.value} for i in body.items]
    updated = await crud.bulk_update(db, items=items, updated_by=current_user.email)

    # Refresh cache for each updated key
    for item in body.items:
        config_service.set(item.key, item.value)

    return [_serialise(u) for u in updated]


@router.post("/refresh-cache")
async def refresh_cache(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Force reload of the in-memory config cache from the database."""
    _require_superadmin(current_user)
    await config_service.load(db)
    return {"status": "ok", "message": "Configuration cache refreshed successfully."}
