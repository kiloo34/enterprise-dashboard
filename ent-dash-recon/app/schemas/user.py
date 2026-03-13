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

class PositionResponse(BaseModel):
    id: int
    name: str
    level: int
    is_active: Optional[bool] = True

    model_config = {"from_attributes": True}


class OrganizationUnitResponse(BaseModel):
    id: int
    name: str
    pluck_code: str
    type: str
    parent_id: Optional[int] = None

    model_config = {"from_attributes": True}


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    position: Optional[PositionResponse] = None
    organization_unit: Optional[OrganizationUnitResponse] = None
    roles: List[RoleResponse] = []

    model_config = {"from_attributes": True}
