"""Pydantic schemas for Translation."""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class TranslationResponse(BaseModel):
    id: int
    namespace: str
    key: str
    language: str
    value: str
    is_editable: bool
    updated_by: Optional[str]
    updated_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class TranslationUpdate(BaseModel):
    """Update a single translation string."""
    namespace: str
    key: str
    language: str
    value: str


class TranslationBulkUpdate(BaseModel):
    """Bulk update multiple translation strings in one request."""
    items: List[TranslationUpdate]
