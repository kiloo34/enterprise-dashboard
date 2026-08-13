import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings
import httpx
import logging

logger = logging.getLogger(__name__)

class TableauService:
    @staticmethod
    def generate_embed_jwt(user_email: str) -> str:
        """
        Generates a JWT for Tableau Connected Apps (Direct Trust).
        Tableau requires specific claims: iss, aud, sub, jti, exp, and scp.
        """
        if not settings.TABLEAU_SECRET_VALUE:
            raise ValueError("Tableau Secret Value is not configured.")

        # Required claims for Tableau Connected Apps embedding JWT
        payload = {
            "iss": settings.TABLEAU_CLIENT_ID,
            "aud": "tableau",
            "sub": user_email,
            "jti": str(uuid.uuid4()),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
            "scp": ["tableau:views:embed", "tableau:metrics:embed"]
        }

        # Tableau requires the 'kid' header to identify which secret to use
        headers = {
            "kid": settings.TABLEAU_SECRET_ID,
            "iss": settings.TABLEAU_CLIENT_ID
        }

        # The token must be signed using HS256 with the Connected App Secret Value
        token = jwt.encode(
            payload,
            settings.TABLEAU_SECRET_VALUE,
            algorithm="HS256",
            headers=headers
        )
        return token

    @staticmethod
    async def trigger_extract_refresh(datasource_id: str) -> bool:
        """
        Triggers a data extract refresh on Tableau Server using a PAT (Personal Access Token).
        """
        if not settings.TABLEAU_PAT_NAME or not settings.TABLEAU_PAT_SECRET:
            logger.warning("Tableau PAT not configured. Skipping refresh.")
            return False

        server_url = settings.TABLEAU_SERVER_URL.rstrip('/')
        api_version = "3.22" # Adjust according to Tableau Server version
        
        # 1. Sign in using PAT
        auth_payload = {
            "credentials": {
                "personalAccessTokenName": settings.TABLEAU_PAT_NAME,
                "personalAccessTokenSecret": settings.TABLEAU_PAT_SECRET,
                "site": {
                    "contentUrl": settings.TABLEAU_SITE_NAME
                }
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                auth_resp = await client.post(
                    f"{server_url}/api/{api_version}/auth/signin",
                    json=auth_payload,
                    headers={"Accept": "application/json", "Content-Type": "application/json"}
                )
                auth_resp.raise_for_status()
                auth_data = auth_resp.json()
                
                site_id = auth_data["credentials"]["site"]["id"]
                token = auth_data["credentials"]["token"]

                # 2. Trigger Refresh
                refresh_resp = await client.post(
                    f"{server_url}/api/{api_version}/sites/{site_id}/datasources/{datasource_id}/refresh",
                    headers={
                        "X-Tableau-Auth": token,
                        "Accept": "application/json"
                    },
                    json={} # Empty payload for POST
                )
                refresh_resp.raise_for_status()
                
                logger.info(f"Successfully triggered extract refresh for datasource {datasource_id}")
                return True
                
            except httpx.HTTPError as e:
                logger.error(f"Failed to communicate with Tableau Server: {str(e)}")
                return False
