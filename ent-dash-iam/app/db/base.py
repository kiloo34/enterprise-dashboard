from app.db.base_class import Base

# Model aggregator for Alembic metadata
from app.models.user import User, Position, OrganizationUnit
from app.models.role_permission import Role, Permission, ModelHasRole, RoleHasPermission
