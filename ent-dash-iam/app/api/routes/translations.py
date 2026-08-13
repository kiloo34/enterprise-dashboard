"""
Translations API Routes.

GET endpoints are PUBLIC — no auth required (translations are needed before login).
PUT endpoint is restricted to super-admin.
"""
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.crud.crud_translation import translation as crud
from app.schemas.translation import TranslationResponse, TranslationBulkUpdate
from app.core.exceptions import AppException

router = APIRouter()


def _require_superadmin(current_user: User) -> None:
    """Raise 403 if the caller is not a super-admin."""
    roles = [r.name for r in (current_user.roles or [])]
    if "super-admin" not in roles:
        raise AppException(
            code="FORBIDDEN",
            message="Only super-admin can manage translations.",
            status_code=status.HTTP_403_FORBIDDEN,
        )


# ── Public GET: all translations for a language ────────────────────────────────

@router.get("", response_model=Dict[str, Dict[str, str]])
async def get_all_translations(
    lang: str = Query(default="ID", description="Language code (ID, EN, ...)"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Return all translation strings as a nested dict: { namespace: { key: value } }.
    No authentication required — used by the frontend before the user logs in.
    """
    return await crud.get_all_as_nested_dict(db, language=lang)


@router.get("/languages", response_model=List[str])
async def get_available_languages(
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Return the list of language codes present in the translations table."""
    return await crud.get_available_languages(db)


@router.get("/{namespace}", response_model=Dict[str, str])
async def get_namespace_translations(
    namespace: str,
    lang: str = Query(default="ID", description="Language code (ID, EN, ...)"),
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Return translations for a single namespace as { key: value }.
    No authentication required.
    """
    rows = await crud.get_namespace(db, namespace=namespace, language=lang)
    return {row.key: row.value for row in rows}


# ── Super-admin PUT: bulk update ───────────────────────────────────────────────

@router.put("", response_model=List[TranslationResponse])
async def bulk_update_translations(
    body: TranslationBulkUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Bulk update translation strings.
    Only rows where is_editable=True will be updated.
    Requires super-admin role.
    """
    _require_superadmin(current_user)
    updated = await crud.bulk_update(
        db,
        items=body.items,
        updated_by=current_user.email,
    )
    return updated
