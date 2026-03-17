from sqlalchemy import Column, Date, String, Boolean, Integer, Numeric
from app.db.base import Base

class FactKinerjaPrc(Base):
    __tablename__ = "fact_kinerjaprc"
    __table_args__ = {"schema": "TABLEAU_REPORT"}

    # PK for SQLAlchemy
    periode_data = Column(Date, primary_key=True)
    wil = Column(String(3), primary_key=True)
    cab = Column(String(3), primary_key=True)
    kelompok = Column(String(30), primary_key=True)
    
    periode_laporan = Column(String(1))
    is_ajp = Column(Boolean, nullable=False, default=False)
    keterangan = Column(String(30))
    urut = Column(Integer)
    jenis = Column(String(1))
    nama_wil = Column(String(30))
    nama_cab = Column(String(30))
    nominal = Column(Numeric)
    rasio = Column(Numeric)
