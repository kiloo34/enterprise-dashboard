from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ScoringRequest(BaseModel):
    # Allow any dynamic dictionary for full flexibility with any ML model features
    data: List[Dict[str, Any]]

class ScoringResult(BaseModel):
    predictions: List[str]
    probabilities: List[Dict[str, float]]
    
class ScoringResponse(BaseModel):
    status: str
    message: str
    results: Optional[ScoringResult] = None
