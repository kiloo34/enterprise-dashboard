from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime


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
    is_visible: bool = True
    deleted_at: Optional[datetime] = None

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
    is_ajp: Optional[bool] = False
    history: Optional[List[Optional[float]]] = []

    class Config:
        from_attributes = True


class FinancialDashboardResponseDto(BaseModel):
    metrics: List[FinancialMetricDto]
    dates: List[str] = []
