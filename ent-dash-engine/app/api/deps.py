from fastapi import Depends
from app.core.exceptions import UnauthorizedException
from ent_dash_common.auth import make_jwt_dependency
from jose import jwt, JWTError
from app.core.config import settings

# Engine service does NOT query the users table.
# All user identity comes from the JWT payload issued by the IAM Service.
get_current_user_payload = make_jwt_dependency(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    api_prefix=settings.API_V1_STR
)

from fastapi import Query

async def get_current_user_from_query(token: str = Query(..., description="Short-lived SSE ticket")) -> dict:
    """
    Validates a short-lived SSE ticket (type='sse', TTL 60s) issued by POST /api/auth/sse-ticket.
    The main access token must NEVER be passed here to avoid it appearing in server logs.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("sub") is None or payload.get("type") != "sse":
            raise UnauthorizedException(message="Invalid SSE ticket", code="INVALID_TOKEN")
        return payload
    except JWTError:
        raise UnauthorizedException(message="Could not validate SSE ticket", code="INVALID_TOKEN")


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
                    f"{settings.IAM_BASE_URL}/api/user/me/permissions",
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

