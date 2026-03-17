from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import date, datetime

class QrisStatsResponseDto(BaseModel):
    totalTransactions: int
    settledAmount: float
    unsettledAmount: float
    totalDiscrepancyAmount: float

class DailyAnalysisResponseDto(BaseModel):
    status: str
    data: Dict[str, Any]

class FinancialIndicatorDto(BaseModel):
    id: int
    slug: str
    label: str
    category: str
    level: int
    is_bold: bool
    is_link: bool
    is_ratio: bool
    urut: Optional[int]
    kelompok: Optional[str]
    jenis: Optional[str]
    
    class Config:
        from_attributes = True

class FinancialMetricDto(BaseModel):
    indicator: FinancialIndicatorDto
    report_date: date
    value: Optional[float]
    target_nominal: Optional[float]
    dtd_nominal: Optional[float]
    dtd_pct: Optional[float]
    mtd_nominal: Optional[float]
    mtd_pct: Optional[float]
    ytd_nominal: Optional[float]
    ytd_pct: Optional[float]
    yoy_nominal: Optional[float]
    yoy_pct: Optional[float]
    wil: Optional[str]
    nama_wil: Optional[str]
    cab: Optional[str]
    nama_cab: Optional[str]
    is_ajp: bool

    class Config:
        from_attributes = True

class FinancialDashboardResponseDto(BaseModel):
    metrics: List[FinancialMetricDto]

class QrisTransactionDto(BaseModel):
    id: str
    timestamp: datetime
    merchant: str
    stan: Optional[str] = None
    nominal: float
    bankStatus: str
    artajasaStatus: Optional[str] = None
    reconStatus: str

class QrisTransactionsResponseDto(BaseModel):
    transactions: List[QrisTransactionDto]
    total: int
