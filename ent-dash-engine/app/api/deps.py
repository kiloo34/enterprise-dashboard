from fastapi import Depends
from app.core.exceptions import UnauthorizedException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Stateless JWT validation — Engine service does NOT query the users table.
    All user identity comes from the JWT payload issued by the IAM Service.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("sub") is None:
            raise UnauthorizedException(message="Invalid token payload", code="INVALID_TOKEN")
        return payload
    except JWTError:
        raise UnauthorizedException(message="Could not validate credentials", code="INVALID_TOKEN")

from fastapi import Query

async def get_current_user_from_query(token: str = Query(..., description="JWT access token")) -> dict:
    """
    Stateless JWT validation for Server-Sent Events (SSE) which cannot send headers.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("sub") is None:
            raise UnauthorizedException(message="Invalid token payload", code="INVALID_TOKEN")
        return payload
    except JWTError:
        raise UnauthorizedException(message="Could not validate credentials", code="INVALID_TOKEN")
