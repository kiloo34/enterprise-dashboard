from fastapi import APIRouter, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app.db.session import get_db
from app.api.deps import get_current_user, require_permissions
from app.models.user import User
from app.schemas.user import OrganizationUnitCreate, OrganizationUnitUpdate, OrganizationUnitResponse, OrganizationUnitTree
from app.services import org_units as org_units_service
from app.services.audit import AuditService

router = APIRouter()

@router.get("/tree", response_model=List[OrganizationUnitTree])
async def read_org_unit_tree(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["org_units:read"]))
) -> Any:
    return await org_units_service.get_org_unit_tree(db)

@router.get("", response_model=List[OrganizationUnitResponse])
async def read_org_units(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permissions(["org_units:read"]))
) -> Any:
    return await org_units_service.get_org_units(db, skip=skip, limit=limit)

@router.post("", response_model=OrganizationUnitResponse, status_code=status.HTTP_201_CREATED)
async def create_org_unit(
    *,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    org_unit_in: OrganizationUnitCreate,
    current_user: User = Depends(require_permissions(["org_units:write"]))
) -> Any:
    new_ou = await org_units_service.create_org_unit(db=db, org_unit_in=org_unit_in)
    await AuditService.log_action(db, current_user.id, "ORGUNIT_CREATED", "OrganizationUnit", str(new_ou.id), org_unit_in.model_dump(), request=http_request)
    return new_ou

@router.patch("/{org_unit_id}", response_model=OrganizationUnitResponse)
async def update_org_unit(
    *,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    org_unit_id: int,
    org_unit_in: OrganizationUnitUpdate,
    current_user: User = Depends(require_permissions(["org_units:write"]))
) -> Any:
    updated_ou = await org_units_service.update_org_unit(db=db, org_unit_id=org_unit_id, org_unit_in=org_unit_in)
    await AuditService.log_action(db, current_user.id, "ORGUNIT_UPDATED", "OrganizationUnit", str(org_unit_id), org_unit_in.model_dump(exclude_unset=True), request=http_request)
    return updated_ou

@router.delete("/{org_unit_id}")
async def delete_org_unit(
    *,
    http_request: Request,
    db: AsyncSession = Depends(get_db),
    org_unit_id: int,
    current_user: User = Depends(require_permissions(["org_units:write"]))
) -> Any:
    result = await org_units_service.delete_org_unit(db=db, org_unit_id=org_unit_id)
    await AuditService.log_action(db, current_user.id, "ORGUNIT_DELETED", "OrganizationUnit", str(org_unit_id), request=http_request)
    return result
