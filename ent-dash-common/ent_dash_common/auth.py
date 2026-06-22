"""
Stateless JWT authentication middleware for microservices.

Design principle:
  - Only the IAM Service *issues* JWTs (owns the User DB).
  - All other services (Analytics, Engine, Recon) *validate* JWTs
    by verifying the signature with the shared SECRET_KEY.
  - No DB lookup is performed — authentication is fully stateless.

The decoded payload is passed to route handlers as a dependency dict:
  { "sub": "user_id_as_string", "exp": unix_timestamp }

Usage in any service:
    from ent_dash_common.auth import make_jwt_dependency

    verify_token = make_jwt_dependency(settings.SECRET_KEY, settings.ALGORITHM, settings.API_V1_STR)

    @router.get("/protected")
    async def route(payload: dict = Depends(verify_token)):
        user_id = int(payload["sub"])
"""
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta
from ent_dash_common.exceptions import UnauthorizedException


def validate_jwt_token(token: str, secret_key: str, algorithm: str) -> dict:
    """Standalone JWT validator for use in gRPC, background tasks, etc."""
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        if payload.get("sub") is None:
            raise UnauthorizedException(message="Invalid token: missing subject", code="INVALID_TOKEN")
        return payload
    except JWTError:
        raise UnauthorizedException(message="Could not validate credentials", code="INVALID_TOKEN")


def generate_service_token(secret_key: str, algorithm: str, expires_minutes: int = 5) -> str:
    """Generate a valid JWT M2M token for internal inter-service communication."""
    now = datetime.utcnow()
    payload = {
        "sub": "0",  # 0 indicates a system/service account
        "type": "service",
        "exp": now + timedelta(minutes=expires_minutes),
        "iat": now,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def make_jwt_dependency(secret_key: str, algorithm: str, api_prefix: str = "/api"):
    """
    Factory function that returns a FastAPI dependency for JWT validation.

    Args:
        secret_key:  Shared secret used to sign and verify JWTs (must match IAM service).
        algorithm:   JWT algorithm (e.g. "HS256").
        api_prefix:  The API prefix for the token URL hint in the OpenAPI docs.

    Returns:
        An async callable that can be used as a FastAPI Depends() dependency.
    """
    oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{api_prefix}/auth/login")

    async def _verify_token(token: str = Depends(oauth2_scheme)) -> dict:
        return validate_jwt_token(token, secret_key, algorithm)

    return _verify_token
