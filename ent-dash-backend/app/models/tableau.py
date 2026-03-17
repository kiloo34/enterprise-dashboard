from sqlalchemy import Column, String, Integer, BigInteger, Numeric, Date, Boolean
from app.db.base import Base

class FactKinerjaPrc(Base):
    __tablename__ = "fact_kinerjaprc"
    __table_args__ = {"schema": "TABLEAU_REPORT"}

    id = Column(BigInteger, primary_key=True, index=True)
    periode_data = Column(Date, nullable=True)
    periode_laporan = Column(String(1), nullable=True)
    is_ajp = Column(Boolean, nullable=False, default=False)
    kelompok = Column(String(30), nullable=True)
    keterangan = Column(String(30), nullable=True)
    urut = Column(Integer, nullable=True)
    jenis = Column(String(1), nullable=True)
    wil = Column(String(3), nullable=True)
    nama_wil = Column(String(30), nullable=True)
    cab = Column(String(3), nullable=True)
    nama_cab = Column(String(30), nullable=True)
    nominal = Column(Numeric, nullable=True)
    rasio = Column(Numeric, nullable=True)
