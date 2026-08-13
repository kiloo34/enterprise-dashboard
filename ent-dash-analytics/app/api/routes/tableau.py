from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
import httpx
import logging
from app.api.deps import get_current_user_payload
from app.services.tableau import TableauService
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

class RefreshRequest(BaseModel):
    datasource_id: str

@router.get("/token", response_model=Dict[str, str])
async def get_tableau_embed_token(
    payload: dict = Depends(get_current_user_payload)
):
    """
    Returns a JWT for Tableau Connected Apps embedding.
    Requires a valid Enterprise Dashboard IAM token.
    """
    # In a real app, the IAM token should include the user's email.
    # We will fetch the email from the IAM service using the raw token if 'email' is not in payload.
    user_email = payload.get("email")
    
    if not user_email:
        # Fallback: Call IAM to get user profile if email is missing from payload
        raw_token = payload.get("_raw_token")
        if not raw_token:
             raise HTTPException(status_code=400, detail="Token lacks raw string, cannot fetch profile.")
             
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    "http://iam:8000/api/user/me",
                    headers={"Authorization": f"Bearer {raw_token}"}
                )
                response.raise_for_status()
                user_email = response.json().get("email")
        except Exception as e:
            logger.error(f"Failed to fetch user email from IAM: {e}")
            raise HTTPException(status_code=500, detail="Could not determine user email for Tableau SSO.")

    if not user_email:
        raise HTTPException(status_code=400, detail="User email is required for Tableau SSO.")

    try:
        jwt_token = TableauService.generate_embed_jwt(user_email)
        return {"token": jwt_token}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh", response_model=Dict[str, Any])
async def trigger_tableau_refresh(
    request: RefreshRequest,
    # In a real app, this should be protected by an internal M2M token or specific RBAC permission.
    # For simplicity, we allow any valid logged-in user or service token.
    payload: dict = Depends(get_current_user_payload)
):
    """
    Triggers an extract refresh for a specific Tableau datasource.
    Typically called by the Recon service after a successful batch job.
    """
    success = await TableauService.trigger_extract_refresh(request.datasource_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to trigger refresh on Tableau Server.")
    
    return {"status": "success", "message": f"Refresh triggered for datasource {request.datasource_id}"}
