"""
Translation model — stores UI translation strings in the database.

Each row represents one translatable string, identified by:
  namespace  — logical group matching the frontend TranslationSchema key
               (e.g. "Common", "Sidebar", "Settings", "Users", "Roles", "Permissions")
  key        — dot-notation path within the namespace
               (e.g. "add", "dashboard", "themes.light.label")
  language   — ISO code uppercase (e.g. "ID", "EN")

A unique constraint on (namespace, key, language) prevents duplicates.
The is_editable flag lets individual strings be locked from UI edits (future use).
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, UniqueConstraint

from app.db.base_class import Base


class Translation(Base):
    """
    Key-value store for UI translation strings, scoped by namespace and language.
    """
    __tablename__ = "translations"
    __table_args__ = (
        UniqueConstraint("namespace", "key", "language", name="uq_translation_ns_key_lang"),
        {"schema": "app"},
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    namespace = Column(String(100), nullable=False, index=True)
    key = Column(String(255), nullable=False, index=True)
    language = Column(String(10), nullable=False, index=True)
    value = Column(Text, nullable=False)
    is_editable = Column(Boolean, default=True, nullable=False)

    # Audit fields
    updated_by = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
