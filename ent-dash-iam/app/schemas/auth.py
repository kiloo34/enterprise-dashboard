from pydantic import BaseModel, EmailStr
from typing import Optional, List


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserPayload(BaseModel):
    name: str
    email: str
    role: Optional[str] = None
    permissions: List[str] = []
    unitCode: Optional[str] = None
    positionName: Optional[str] = None
    positionLevel: Optional[int] = None
    uiSettings: Optional[dict] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPayload
