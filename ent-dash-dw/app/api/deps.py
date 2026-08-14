from fastapi import Depends
from app.core.config import settings
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from ent_dash_common.auth import make_jwt_dependency

# Create a JWT validation dependency using the shared common module.
# The DW service is stateless and trusts the token issued by the IAM service.
get_current_user_payload = make_jwt_dependency(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    api_prefix=settings.API_V1_STR
)
