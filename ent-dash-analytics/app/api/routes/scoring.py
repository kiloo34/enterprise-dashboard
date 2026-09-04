from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.ml_scoring import ScoringRequest, ScoringResponse
from app.services.ml_scoring import DataikuScoringService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

def get_scoring_service():
    return DataikuScoringService.get_instance()

@router.post("/predict", response_model=ScoringResponse)
async def predict_score(
    request: ScoringRequest,
    scoring_service: DataikuScoringService = Depends(get_scoring_service)
):
    try:
        result = scoring_service.predict(request)
        return ScoringResponse(
            status="success",
            message="Prediction completed successfully",
            results=result
        )
    except ValueError as ve:
        logger.error(f"Prediction configuration error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scoring service is currently unavailable due to model configuration."
        )
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during model prediction."
        )
