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


def require_engine_permission(required_permissions: list[str]):
    """
    Permission gate for Engine service endpoints.

    Since Engine is stateless (no user DB), this checks permissions by
    calling the IAM service's internal endpoint. The user_id is extracted
    from the JWT payload.
    """
    import httpx

    async def permission_checker(
        payload: dict = Depends(get_current_user_payload),
    ) -> dict:
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedException(message="Invalid token", code="INVALID_TOKEN")

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    f"http://iam:8000/api/user/me/permissions",
                    headers={"Authorization": f"Bearer {payload.get('_raw_token', '')}"},
                )
                # If IAM is unreachable, deny by default (fail-safe)
                if response.status_code != 200:
                    raise UnauthorizedException(
                        message="Permission validation failed",
                        code="PERMISSION_DENIED",
                    )

                user_perms = set(response.json().get("permissions", []))

                # Super Admin bypass
                roles = response.json().get("roles", [])
                if any(r.get("name") in ["Super Admin", "super-admin"] for r in roles):
                    return payload

                missing = [p for p in required_permissions if p not in user_perms]
                if missing:
                    from fastapi import HTTPException, status
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Missing permissions: {', '.join(missing)}",
                    )

        except httpx.RequestError:
            # Network error: fail-safe — deny access
            raise UnauthorizedException(
                message="IAM service unreachable for permission check",
                code="IAM_UNREACHABLE",
            )

        return payload

    return permission_checker

