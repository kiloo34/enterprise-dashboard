from fastapi import APIRouter, Depends
from app.core.exceptions import UnauthorizedException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any

from app.db.session import get_db
from app.core.security import create_access_token
from app.models.user import Position, OrganizationUnit
from app.models.role_permission import Role, Permission, ModelHasRole, RoleHasPermission
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import authenticate_user

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    user = await authenticate_user(db, email=request.email, password=request.password)
    if not user:
        raise UnauthorizedException(
            message="Incorrect email or password",
            code="INVALID_CREDENTIALS"
        )

    # Fetch role for user
    role_result = await db.execute(
        select(Role)
        .join(ModelHasRole, ModelHasRole.role_id == Role.id)
        .where(ModelHasRole.model_id == user.id)
    )
    role = role_result.scalars().first()

    # Fetch permissions for role
    permissions = []
    if role:
        perm_result = await db.execute(
            select(Permission)
            .join(RoleHasPermission, RoleHasPermission.permission_id == Permission.id)
            .where(RoleHasPermission.role_id == role.id)
        )
        permissions = [p.name for p in perm_result.scalars().all()]

    # Fetch position
    position = None
    if user.position_id:
        pos_res = await db.execute(select(Position).where(Position.id == user.position_id))
        position = pos_res.scalars().first()

    # Fetch organization unit
    unit = None
    if user.organization_unit_id:
        unit_res = await db.execute(select(OrganizationUnit).where(OrganizationUnit.id == user.organization_unit_id))
        unit = unit_res.scalars().first()

    access_token = create_access_token(subject=user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 3600 * 24 * 7,
        "user": {
            "name": user.name,
            "email": user.email,
            "role": role.name if role else None,
            "permissions": permissions,
            "unitCode": unit.pluck_code if unit else None,
            "positionName": position.name if position else None,
            "positionLevel": position.level if position else None,
            "uiSettings": user.ui_settings or {},
        }
    }
