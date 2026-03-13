from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from typing import List, Optional
from app.models.user import User, Position, OrganizationUnit
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

async def get_all_users(db: AsyncSession) -> List[User]:
    query = select(User).options(
        joinedload(User.position),
        joinedload(User.organization_unit),
        joinedload(User.roles)
    )
    result = await db.execute(query)
    return result.unique().scalars().all()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    user_data = user_in.model_dump(exclude={"password"})
    hashed_password = get_password_hash(user_in.password)
    user_data["password"] = hashed_password
    
    new_user = User(**user_data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_positions(db: AsyncSession) -> List[Position]:
    result = await db.execute(select(Position))
    return result.scalars().all()

async def get_organization_units(db: AsyncSession) -> List[OrganizationUnit]:
    result = await db.execute(select(OrganizationUnit))
    return result.scalars().all()
