from fastapi import Depends, Cookie, Request
from app.core.exceptions import UnauthorizedException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.role_permission import Role

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = UnauthorizedException(
        message="Could not validate credentials",
        code="INVALID_TOKEN"
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type", "access")  # backward compat
        if user_id is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .where(User.id == int(user_id))
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.position),
            selectinload(User.organization_unit),
        )
    )
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user


async def get_current_user_payload(
    token: str = Depends(oauth2_scheme)
) -> dict:
    """Decodes JWT and returns the payload claims as a dict."""
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_type: str = payload.get("type", "access")
        if token_type != "access":
            raise UnauthorizedException(
                message="Invalid token type",
                code="INVALID_TOKEN"
            )
        return payload
    except JWTError:
        raise UnauthorizedException(
            message="Could not validate credentials",
            code="INVALID_TOKEN"
        )


async def get_current_user_from_refresh_token(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    """Reads refresh_token from cookie and validates it."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise UnauthorizedException(
            message="Refresh token missing",
            code="TOKEN_MISSING"
        )
        
    credentials_exception = UnauthorizedException(
        message="Could not validate refresh token",
        code="INVALID_TOKEN"
    )
    
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id is None or token_type != "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(
        select(User)
        .where(User.id == int(user_id))
        .options(
            selectinload(User.roles).selectinload(Role.permissions),
            selectinload(User.position),
            selectinload(User.organization_unit),
        )
    )
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
    return user
