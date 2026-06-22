from fastapi import APIRouter, Depends, Response, Request
from app.core.exceptions import UnauthorizedException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.core.config import settings
from app.db.session import get_db
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import AuthService
from app.crud.crud_user import user as crud_user
from app.api.deps import get_current_user_from_refresh_token
from app.models.user import User
from app.services.audit import AuditService


router = APIRouter()


@router.get("/health-check")
async def health_check(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    try:
        result = await db.execute(text("SELECT count(*) FROM app.users"))
        count = result.scalar()
        return {"status": "iam-reachable", "user_count": count}
    except Exception as e:
        return {"status": "iam-reachable", "db_error": str(e)}


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    http_request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> Any:
    auth_service = AuthService(db)
    user_obj = await auth_service.authenticate(email=request.email, password=request.password)
    if not user_obj:
        await AuditService.log_action(db, None, "LOGIN_FAILED", "Auth", request.email, request=http_request)
        raise UnauthorizedException(
            message="Incorrect email or password",
            code="INVALID_CREDENTIALS"
        )

    user_profile = await crud_user.get_full_profile(db, user_id=user_obj.id)
    access_token = create_access_token(subject=user_obj.id)
    refresh_token = create_refresh_token(subject=user_obj.id)

    # Set refresh token as HttpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=not settings.DEBUG,  # True in production (HTTPS)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    await AuditService.log_action(db, user_obj.id, "LOGIN_SUCCESS", "Auth", request.email, request=http_request)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user_profile
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_from_refresh_token)
) -> Any:
    """Generate new access token using refresh token cookie."""
    # Issue new tokens (Sliding expiration for refresh token)
    user_profile = await crud_user.get_full_profile(db, user_id=current_user.id)
    new_access_token = create_access_token(subject=current_user.id)
    new_refresh_token = create_refresh_token(subject=current_user.id)

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user_profile
    }


@router.post("/logout")
async def logout(response: Response, http_request: Request, db: AsyncSession = Depends(get_db)) -> Any:
    """Clear refresh token cookie."""
    response.delete_cookie(
        key="refresh_token",
        path="/",
        secure=not settings.DEBUG,
        httponly=True,
        samesite="lax"
    )
    await AuditService.log_action(db, None, "LOGOUT", "Auth", "session_cleared", request=http_request)
    return {"message": "Successfully logged out"}
