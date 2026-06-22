from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from app.models.user import User, Position, OrganizationUnit
from app.models.role_permission import Role
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash


class UserService:
    """
    Handles complex user management business logic.
    Receives the DB session via constructor injection (OOP standard).
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> List[User]:
        """Retrieve all users with their related position, org unit, and roles."""
        query = select(User).options(
            selectinload(User.position),
            selectinload(User.organization_unit),
            selectinload(User.roles).selectinload(Role.permissions),
        )
        result = await self.db.execute(query)
        return result.unique().scalars().all()

    async def create(self, user_in: UserCreate) -> User:
        """Create a new user, hashing the password before persisting."""
        user_data = user_in.model_dump(exclude={"password"})
        hashed_password = get_password_hash(user_in.password)
        user_data["password"] = hashed_password

        new_user = User(**user_data)
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user

    async def update_settings(self, user: User, settings_update: UserUpdate) -> User:
        """Update mutable user profile fields."""
        update_data = settings_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def get_positions(self) -> List[Position]:
        """Retrieve all available positions."""
        result = await self.db.execute(select(Position))
        return result.scalars().all()

    async def get_organization_units(self) -> List[OrganizationUnit]:
        """Retrieve all available organization units."""
        result = await self.db.execute(select(OrganizationUnit))
        return result.scalars().all()
