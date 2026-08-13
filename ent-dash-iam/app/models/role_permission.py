from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime, timezone


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    name = Column(String, unique=True, index=True, nullable=False)
    guard_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None), onupdate=lambda: datetime.now(timezone.utc).replace(tzinfo=None))

    # Relationship to permissions
    permissions = relationship(
        "Permission",
        secondary="app.role_has_permissions",
        primaryjoin="foreign(Role.id) == RoleHasPermission.role_id",
        secondaryjoin="foreign(Permission.id) == RoleHasPermission.permission_id",
    )


class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    guard_name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    owner = Column(String(255), nullable=True)


class ModelHasRole(Base):
    __tablename__ = "model_has_roles"
    __table_args__ = {"schema": "app"}

    role_id = Column(BigInteger, ForeignKey("app.roles.id", ondelete="CASCADE"), primary_key=True)
    model_type = Column(String(255), primary_key=True)
    model_id = Column(BigInteger, primary_key=True)


class RoleHasPermission(Base):
    __tablename__ = "role_has_permissions"
    __table_args__ = {"schema": "app"}

    permission_id = Column(BigInteger, ForeignKey("app.permissions.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(BigInteger, ForeignKey("app.roles.id", ondelete="CASCADE"), primary_key=True)
