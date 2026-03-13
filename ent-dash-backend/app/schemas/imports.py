from pydantic import BaseModel, field_serializer
from typing import Optional, Any, Dict
from datetime import datetime

class FileImportResponse(BaseModel):
    id: Any  # UUID or str from DB
    user_id: Optional[int] = None
    file_name: str
    file_path: str
    target_table: str
    total_rows: int = 0
    processed_rows: int = 0
    failed_rows: int = 0
    status: str
    error_log: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_serializer("id")
    def serialize_id(self, v: Any) -> str:
        return str(v)

    model_config = {"from_attributes": True}

class FileImportCreateResponse(BaseModel):
    id: Any
    status: str
    message: str
    import_id: Optional[str] = None
    file_name: Optional[str] = None
    progress: Optional[int] = None

    @field_serializer("id")
    def serialize_id(self, v: Any) -> str:
        return str(v)
