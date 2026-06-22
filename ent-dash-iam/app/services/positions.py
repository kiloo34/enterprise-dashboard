from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.user import Position
from app.schemas.user import PositionCreate, PositionUpdate

async def get_positions(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(Position).offset(skip).limit(limit))
    return result.scalars().all()

async def get_position_by_id(db: AsyncSession, position_id: int):
    result = await db.execute(select(Position).filter(Position.id == position_id))
    position = result.scalars().first()
    if not position:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Position not found")
    return position

async def create_position(db: AsyncSession, position_in: PositionCreate):
    db_position = Position(
        name=position_in.name,
        level=position_in.level,
        is_active=position_in.is_active
    )
    db.add(db_position)
    await db.commit()
    await db.refresh(db_position)
    return db_position

async def update_position(db: AsyncSession, position_id: int, position_in: PositionUpdate):
    db_position = await get_position_by_id(db, position_id)
    
    update_data = position_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_position, field, value)
        
    await db.commit()
    await db.refresh(db_position)
    return db_position

async def delete_position(db: AsyncSession, position_id: int):
    db_position = await get_position_by_id(db, position_id)
    await db.delete(db_position)
    await db.commit()
    return {"message": "Position deleted successfully"}
