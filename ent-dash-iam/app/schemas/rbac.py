from pydantic import BaseModel
from typing import Optional


class PermissionBase(BaseModel):
    name: str
    guard_name: str = "web"
    description: Optional[str] = None
    owner: Optional[str] = None

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(PermissionBase):
    pass
class PermissionResponse(PermissionBase):
    id: int

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str
    guard_name: str = "web"


class RoleCreate(RoleBase):
    permissions: list[int] = []


class RoleUpdate(RoleBase):
    name: Optional[str] = None
    permissions: Optional[list[int]] = None


class RoleResponse(RoleBase):
    id: int
    permissions: list[PermissionResponse] = []

    class Config:
        from_attributes = True
