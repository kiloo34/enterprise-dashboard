from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.schemas.user import UserUpdate

async def update_user_settings(db: AsyncSession, user: User, settings_update: UserUpdate) -> User:
    update_data = settings_update.model_dump(exclude_unset=True)

    for field in update_data:
        setattr(user, field, update_data[field])

    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
