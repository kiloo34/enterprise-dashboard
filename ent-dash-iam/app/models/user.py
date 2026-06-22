from sqlalchemy import Column, String, BigInteger, JSON, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)
    password = Column(String, nullable=False)

    position_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("app.positions.id"), nullable=True)
    organization_unit_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("app.organization_units.id"), nullable=True)
    direct_superior_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("app.users.id"), nullable=True)

    ui_settings = Column(JSON, nullable=True)

    two_factor_secret = Column(String, nullable=True)
    two_factor_recovery_codes = Column(String, nullable=True)
    two_factor_confirmed_at = Column(DateTime, nullable=True)
    remember_token = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    position = relationship("Position", foreign_keys=[position_id])
    organization_unit = relationship("OrganizationUnit", foreign_keys=[organization_unit_id])
    roles = relationship(
        "Role",
        secondary="app.model_has_roles",
        primaryjoin="foreign(User.id) == ModelHasRole.model_id",
        secondaryjoin="foreign(Role.id) == ModelHasRole.role_id",
        viewonly=True,
    )


class Position(Base):
    __tablename__ = "positions"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    level = Column(BigInteger, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OrganizationUnit(Base):
    __tablename__ = "organization_units"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    pluck_code = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False)
    parent_id = Column(BigInteger, ForeignKey("app.organization_units.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Hierarchy Relationships
    parent = relationship("OrganizationUnit", remote_side=[id], back_populates="children")
    children = relationship("OrganizationUnit", back_populates="parent")
