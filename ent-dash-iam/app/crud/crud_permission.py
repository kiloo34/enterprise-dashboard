from ent_dash_common.crud import CRUDBase
from app.models.role_permission import Permission
from app.schemas.rbac import PermissionBase


class CRUDPermission(CRUDBase[Permission, PermissionBase, PermissionBase]):
    pass


permission = CRUDPermission(Permission)
