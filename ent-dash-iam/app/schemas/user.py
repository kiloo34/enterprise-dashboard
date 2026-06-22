from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Any, List
from datetime import datetime
from app.schemas.rbac import RoleResponse


class UserBase(BaseModel):
    name: str = Field(..., max_length=255)
    email: EmailStr
    position_id: Optional[int] = None
    organization_unit_id: Optional[int] = None
    direct_superior_id: Optional[int] = None
    ui_settings: Optional[dict[str, Any]] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(UserBase):
    name: Optional[str] = Field(None, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)

class UserRoleAssign(BaseModel):
    role_ids: List[int] = []


class PositionBase(BaseModel):
    name: str
    level: int
    is_active: Optional[bool] = True

class PositionCreate(PositionBase):
    pass

class PositionUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    is_active: Optional[bool] = None

class PositionResponse(PositionBase):
    id: int
    model_config = {"from_attributes": True}


class OrganizationUnitBase(BaseModel):
    name: str
    pluck_code: str
    type: str
    parent_id: Optional[int] = None

class OrganizationUnitCreate(OrganizationUnitBase):
    pass

class OrganizationUnitUpdate(BaseModel):
    name: Optional[str] = None
    pluck_code: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None

class OrganizationUnitResponse(OrganizationUnitBase):
    id: int
    model_config = {"from_attributes": True}


class OrganizationUnitTree(OrganizationUnitResponse):
    children: List["OrganizationUnitTree"] = []

OrganizationUnitTree.model_rebuild()


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    position: Optional[PositionResponse] = None
    organization_unit: Optional[OrganizationUnitResponse] = None
    roles: List[RoleResponse] = []

    model_config = {"from_attributes": True}
