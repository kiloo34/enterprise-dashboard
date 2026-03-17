from fastapi import Depends
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
        if user_id is None:
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
