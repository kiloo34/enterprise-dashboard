from sqlalchemy import Column, String, BigInteger, Boolean, Float, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime


class FinancialIndicator(Base):
    """
    Defines a row in the dashboard (e.g., 'TOTAL DPK', 'GIRO', 'NPL').
    Owned by the Analytics Service.
    """
    __tablename__ = "financial_indicators"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    label = Column(String, nullable=False)
    category = Column(String, nullable=False)
    level = Column(BigInteger, default=0)
    is_bold = Column(Boolean, default=False)
    is_link = Column(Boolean, default=False)
    is_ratio = Column(Boolean, default=False)
    urut = Column(BigInteger, nullable=True)
    kelompok = Column(String(30), nullable=True)
    jenis = Column(String(1), nullable=True)
    is_visible = Column(Boolean, default=True)
    deleted_at = Column(DateTime, nullable=True)

    parent_id = Column(BigInteger, ForeignKey("app.financial_indicators.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    children = relationship("FinancialIndicator", backref="parent", remote_side=[id])


class FinancialMetric(Base):
    """
    Stores actual values for an indicator on a specific date.
    This is the core Big Data table — millions of rows expected.
    """
    __tablename__ = "financial_metrics"
    __table_args__ = {"schema": "app"}

    id = Column(BigInteger, primary_key=True, index=True)
    indicator_id = Column(BigInteger, ForeignKey("app.financial_indicators.id"), nullable=False)
    report_date = Column(Date, nullable=False, index=True)

    wil = Column(String(3), nullable=True)
    nama_wil = Column(String(30), nullable=True)
    cab = Column(String(3), nullable=True)
    nama_cab = Column(String(30), nullable=True)
    is_ajp = Column(Boolean, default=False)

    value = Column(Float, nullable=True)
    target_nominal = Column(Float, nullable=True)

    dtd_nominal = Column(Float, nullable=True)
    dtd_pct = Column(Float, nullable=True)
    mtd_nominal = Column(Float, nullable=True)
    mtd_pct = Column(Float, nullable=True)
    ytd_nominal = Column(Float, nullable=True)
    ytd_pct = Column(Float, nullable=True)
    yoy_nominal = Column(Float, nullable=True)
    yoy_pct = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    indicator = relationship("FinancialIndicator")
