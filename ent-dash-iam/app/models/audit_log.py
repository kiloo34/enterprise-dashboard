from sqlalchemy import Column, String, BigInteger, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("app.users.id"), nullable=True, index=True)
    
    # Core Audit Fields
    action = Column(String, nullable=False, index=True)
    target_type = Column(String, nullable=False, index=True)
    target_id = Column(String, nullable=True)
    
    # Forensic Fields for UU PDP Compliance
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    endpoint = Column(String, nullable=True)
    method = Column(String, nullable=True)
    status_code = Column(Integer, nullable=True)
    
    # Payload & Metadata
    details = Column(JSON, nullable=True)
    payload = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
