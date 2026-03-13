from sqlalchemy import Column, BigInteger, String, Text, DateTime, JSON
from app.db.base import Base
from datetime import datetime


class ActivityLog(Base):
    __tablename__ = "activity_log"
    __table_args__ = {"schema": "public"}

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    log_name = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    subject_type = Column(String(255), nullable=True)
    event = Column(String(255), nullable=True)
    subject_id = Column(String(255), nullable=True)
    causer_type = Column(String(255), nullable=True)
    causer_id = Column(BigInteger, nullable=True)
    properties = Column(JSON, nullable=True)
    batch_uuid = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
