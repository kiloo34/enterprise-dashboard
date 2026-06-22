from sqlalchemy import Column, String, BigInteger, JSON, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)
    password = Column(String, nullable=False)

    position_id = Column(BigInteger, ForeignKey("app.positions.id"), nullable=True)
    organization_unit_id = Column(BigInteger, ForeignKey("app.organization_units.id"), nullable=True)
    direct_superior_id = Column(BigInteger, ForeignKey("app.users.id"), nullable=True)

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

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(BigInteger, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class OrganizationUnit(Base):
    __tablename__ = "organization_units"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String, nullable=False)
    pluck_code = Column(String, nullable=False, unique=True)
    type = Column(String, nullable=False)
    parent_id = Column(BigInteger, ForeignKey("app.organization_units.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
