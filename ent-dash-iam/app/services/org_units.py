from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException, status
from app.models.user import OrganizationUnit
from app.schemas.user import OrganizationUnitCreate, OrganizationUnitUpdate
from sqlalchemy.orm import selectinload

async def get_org_units(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(OrganizationUnit).offset(skip).limit(limit))
    return result.scalars().all()

async def get_org_unit_by_id(db: AsyncSession, org_unit_id: int):
    result = await db.execute(select(OrganizationUnit).filter(OrganizationUnit.id == org_unit_id))
    org_unit = result.scalars().first()
    if not org_unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization Unit not found")
    return org_unit

async def create_org_unit(db: AsyncSession, org_unit_in: OrganizationUnitCreate):
    # Check if pluck code already exists
    result = await db.execute(select(OrganizationUnit).filter(OrganizationUnit.pluck_code == org_unit_in.pluck_code))
    if result.scalars().first():
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pluck code already registered")

    db_org_unit = OrganizationUnit(
        name=org_unit_in.name,
        pluck_code=org_unit_in.pluck_code,
        type=org_unit_in.type,
        parent_id=org_unit_in.parent_id
    )
    db.add(db_org_unit)
    await db.commit()
    await db.refresh(db_org_unit)
    return db_org_unit

async def update_org_unit(db: AsyncSession, org_unit_id: int, org_unit_in: OrganizationUnitUpdate):
    db_org_unit = await get_org_unit_by_id(db, org_unit_id)
    
    # Check pluck code uniqueness if updating
    if org_unit_in.pluck_code is not None and org_unit_in.pluck_code != db_org_unit.pluck_code:
        result = await db.execute(select(OrganizationUnit).filter(OrganizationUnit.pluck_code == org_unit_in.pluck_code))
        if result.scalars().first():
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pluck code already registered")

    update_data = org_unit_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_org_unit, field, value)
        
    await db.commit()
    await db.refresh(db_org_unit)
    return db_org_unit

async def delete_org_unit(db: AsyncSession, org_unit_id: int):
    db_org_unit = await get_org_unit_by_id(db, org_unit_id)
    await db.delete(db_org_unit)
    await db.commit()
    return {"message": "Organization Unit deleted successfully"}


async def get_org_unit_tree(db: AsyncSession):
    """
    Fetches the organization unit hierarchy up to 5 levels deep.
    """
    query = (
        select(OrganizationUnit)
        .filter(OrganizationUnit.parent_id == None)
        .options(
            selectinload(OrganizationUnit.children)
            .selectinload(OrganizationUnit.children)
            .selectinload(OrganizationUnit.children)
            .selectinload(OrganizationUnit.children)
        )
    )
    result = await db.execute(query)
    return result.scalars().all()
