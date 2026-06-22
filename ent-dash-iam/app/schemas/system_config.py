"""Pydantic schemas for SystemConfig."""
from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, field_validator

from app.models.system_config import ConfigValueType


class SystemConfigBase(BaseModel):
    key: str
    value: str
    value_type: ConfigValueType = ConfigValueType.string
    description: Optional[str] = None
    is_editable: bool = True
    is_sensitive: bool = False


class SystemConfigCreate(SystemConfigBase):
    pass


class SystemConfigUpdate(BaseModel):
    value: str
    description: Optional[str] = None


class SystemConfigBulkUpdateItem(BaseModel):
    key: str
    value: str


class SystemConfigBulkUpdate(BaseModel):
    items: List[SystemConfigBulkUpdateItem]


class SystemConfigResponse(BaseModel):
    id: int
    key: str
    value: str
    value_type: ConfigValueType
    description: Optional[str]
    is_editable: bool
    is_sensitive: bool
    updated_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    @field_validator("value", mode="before")
    @classmethod
    def mask_sensitive(cls, v: Any, info: Any) -> str:
        """Mask value for sensitive configs when serialising."""
        # Access `is_sensitive` via model data; handled in the route layer instead
        return v

    model_config = {"from_attributes": True}
