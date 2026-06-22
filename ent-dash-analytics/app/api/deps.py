from fastapi import Depends
from app.core.exceptions import UnauthorizedException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from app.core.config import settings

# Note: Analytics service DOES NOT own the users table.
# It only validates the JWT token that was ISSUED by the IAM Service.
# The token payload (user_id, role, etc.) is trusted without DB lookup.

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_current_user_payload(
    token: str = Depends(oauth2_scheme)
) -> dict:
    """
    Validate JWT and return the decoded payload dict.
    Analytics Service does NOT query a users table — it trusts the IAM token.
    The payload contains: sub (user_id), exp.
    """
    credentials_exception = UnauthorizedException(
        message="Could not validate credentials",
        code="INVALID_TOKEN"
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception
