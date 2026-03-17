from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import date, datetime

class QrisStatsResponseDto(BaseModel):
    totalTransactions: int
    settledAmount: float
    unsettledAmount: float
    totalDiscrepancyAmount: float

class DailyAnalysisResponseDto(BaseModel):
    status: str
    data: Dict[str, Any]

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
