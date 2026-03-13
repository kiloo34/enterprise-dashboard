from pydantic import BaseModel
from typing import Optional, Dict, Any

class QrisStatsResponseDto(BaseModel):
    totalTransactions: int
    settledAmount: float
    unsettledAmount: float
    totalDiscrepancyAmount: float

class DailyAnalysisResponseDto(BaseModel):
    status: str
    data: Dict[str, Any]
