"""CRUD operations for Translation."""
from typing import Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ent_dash_common.crud import CRUDBase
from app.models.translation import Translation
from app.schemas.translation import TranslationUpdate, TranslationBulkUpdate


class CRUDTranslation(CRUDBase[Translation, TranslationUpdate, TranslationUpdate]):

    async def get_by_key(
        self,
        db: AsyncSession,
        *,
        namespace: str,
        key: str,
        language: str,
    ) -> Optional[Translation]:
        result = await db.execute(
            select(Translation).where(
                Translation.namespace == namespace,
                Translation.key == key,
                Translation.language == language.upper(),
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_language(self, db: AsyncSession, *, language: str) -> List[Translation]:
        result = await db.execute(
            select(Translation)
            .where(Translation.language == language.upper())
            .order_by(Translation.namespace, Translation.key)
        )
        return list(result.scalars().all())

    async def get_namespace(
        self, db: AsyncSession, *, namespace: str, language: str
    ) -> List[Translation]:
        result = await db.execute(
            select(Translation).where(
                Translation.namespace == namespace,
                Translation.language == language.upper(),
            ).order_by(Translation.key)
        )
        return list(result.scalars().all())

    async def get_all_as_nested_dict(
        self, db: AsyncSession, *, language: str
    ) -> Dict[str, Dict[str, str]]:
        """
        Returns { namespace: { "dot.key": value } } for the given language.
        Used by the public GET /api/translations endpoint.
        """
        rows = await self.get_all_by_language(db, language=language)
        result: Dict[str, Dict[str, str]] = {}
        for row in rows:
            result.setdefault(row.namespace, {})[row.key] = row.value
        return result

    async def get_available_languages(self, db: AsyncSession) -> List[str]:
        """Returns the distinct language codes present in the table."""
        from sqlalchemy import distinct
        result = await db.execute(
            select(distinct(Translation.language)).order_by(Translation.language)
        )
        return list(result.scalars().all())

    async def upsert(
        self,
        db: AsyncSession,
        *,
        namespace: str,
        key: str,
        language: str,
        value: str,
        updated_by: Optional[str] = None,
    ) -> Translation:
        """
        Insert a new row or update value if already exists.
        If is_editable=False, the existing value is NOT overwritten
        (preserves admin edits across restarts).
        """
        obj = await self.get_by_key(db, namespace=namespace, key=key, language=language)
        if obj:
            # Never overwrite if not editable
            if obj.is_editable:
                obj.value = value
                if updated_by:
                    obj.updated_by = updated_by
                db.add(obj)
                await db.commit()
                await db.refresh(obj)
        else:
            obj = Translation(
                namespace=namespace,
                key=key,
                language=language.upper(),
                value=value,
                updated_by=updated_by,
            )
            db.add(obj)
            await db.commit()
            await db.refresh(obj)
        return obj

    async def seed_upsert(
        self,
        db: AsyncSession,
        *,
        namespace: str,
        key: str,
        language: str,
        value: str,
    ) -> None:
        """
        Idempotent seed insert: only inserts if the row does NOT exist.
        Existing values are NEVER overwritten so admin edits survive restarts.
        """
        obj = await self.get_by_key(db, namespace=namespace, key=key, language=language)
        if not obj:
            db.add(Translation(
                namespace=namespace,
                key=key,
                language=language.upper(),
                value=value,
            ))

    async def bulk_update(
        self,
        db: AsyncSession,
        *,
        items: List[TranslationUpdate],
        updated_by: Optional[str] = None,
    ) -> List[Translation]:
        """Update multiple strings at once. Only updates rows where is_editable=True."""
        updated = []
        for item in items:
            obj = await self.get_by_key(
                db, namespace=item.namespace, key=item.key, language=item.language
            )
            if obj and obj.is_editable:
                obj.value = item.value
                if updated_by:
                    obj.updated_by = updated_by
                db.add(obj)
                updated.append(obj)
        await db.commit()
        for obj in updated:
            await db.refresh(obj)
        return updated


translation = CRUDTranslation(Translation)
