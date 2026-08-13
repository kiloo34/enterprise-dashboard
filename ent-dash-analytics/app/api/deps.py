from app.core.config import settings
from ent_dash_common.auth import make_jwt_dependency

# Analytics service DOES NOT own the users table.
# It only validates the JWT token that was ISSUED by the IAM Service.
# The token payload (user_id, role, etc.) is trusted without DB lookup.
get_current_user_payload = make_jwt_dependency(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    api_prefix=settings.API_V1_STR
)
