from sqlalchemy import Column, String, BigInteger, JSON, DateTime, ForeignKey
from app.db.base import Base
from datetime import datetime

class FileImport(Base):
    __tablename__ = "file_imports"
    __table_args__ = {"schema": "app"}
    
    # Needs to match Laravel UUID format
    id = Column(String(36), primary_key=True)
    user_id = Column(BigInteger, ForeignKey("app.users.id", ondelete="CASCADE"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    target_table = Column(String(255), nullable=False)
    
    total_rows = Column(BigInteger, default=0)
    processed_rows = Column(BigInteger, default=0)
    failed_rows = Column(BigInteger, default=0)
    status = Column(String(50), default="pending")
    
    error_log = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
