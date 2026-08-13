"""
SystemConfig model — stores dynamic system configuration in the database.

Security note:
  Credentials (SECRET_KEY, POSTGRES_*, KAFKA_*) must NEVER be stored here.
  Only safe, operator-managed settings belong in this table.
"""
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum as SAEnum
import enum

from app.db.base_class import Base


class ConfigValueType(str, enum.Enum):
    string = "string"
    integer = "integer"
    boolean = "boolean"
    list = "list"       # Stored as comma-separated string
    json = "json"       # Stored as JSON string


class SystemConfig(Base):
    """
    Key-value store for dynamic system configuration.

    Attributes:
        key         Dot-notation key, e.g. "cors.allowed_origins"
        value       Stored as plain text; parse according to value_type
        value_type  How to deserialise the value field
        description Human-readable explanation shown in the admin UI
        is_editable Whether operators may change this via the API
        is_sensitive Mask value in API responses (e.g. future API tokens)
        updated_by  Email of the last user who changed this record
    """
    __tablename__ = "system_configs"
    __table_args__ = {"schema": "app"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(150), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    value_type = Column(
        SAEnum(ConfigValueType, name="config_value_type", schema="app"),
        default=ConfigValueType.string,
        nullable=False,
    )
    description = Column(Text, nullable=True)
    is_editable = Column(Boolean, default=True, nullable=False)
    is_sensitive = Column(Boolean, default=False, nullable=False)

    # Audit fields
    updated_by = Column(String(255), nullable=True)   # email of last editor
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None), nullable=False)
