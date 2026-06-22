from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.core.security import verify_password
from typing import Optional


class AuthService:
    """
    Handles user authentication logic.
    Receives the DB session via constructor injection (OOP standard).
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Validate email+password and return the User if credentials are valid,
        or None if authentication fails.
        """
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        return user
