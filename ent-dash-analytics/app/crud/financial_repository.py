"""
Financial Repository — Data Access Layer for ent-dash-analytics.

Encapsulates all SQL queries for FinancialMetric and FinancialIndicator,
keeping the service layer free of raw database access logic.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Any
from datetime import datetime

from app.models.financial import FinancialMetric, FinancialIndicator


class FinancialRepository:
    """Repository for all Financial Metric and Indicator queries."""

    def __init__(self, db: AsyncSession):
        self._db = db

    async def get_latest_report_dates(self, limit: int = 5) -> List[Any]:
        """Returns the most recent distinct report dates."""
        result = await self._db.execute(
            select(FinancialMetric.report_date)
            .distinct()
            .order_by(FinancialMetric.report_date.desc())
            .limit(limit)
        )
        return [r[0] for r in result.all()]

    async def get_indicators_with_metrics(
        self,
        dates: List[Any],
        category: Optional[str] = None
    ) -> List[Any]:
        """
        LEFT JOIN FinancialIndicator with FinancialMetric for the given dates.
        Optionally filters by category.
        """
        query = select(FinancialIndicator, FinancialMetric)

        if dates:
            query = query.outerjoin(
                FinancialMetric,
                and_(
                    FinancialMetric.indicator_id == FinancialIndicator.id,
                    FinancialMetric.report_date.in_(dates)
                )
            ).order_by(FinancialIndicator.urut, FinancialMetric.report_date.asc())
        else:
            query = query.outerjoin(
                FinancialMetric,
                FinancialMetric.id == -1
            ).order_by(FinancialIndicator.urut)

        query = query.where(
            FinancialIndicator.is_visible == True,
            FinancialIndicator.deleted_at == None
        )

        if category:
            query = query.where(FinancialIndicator.category == category)

        result = await self._db.execute(query)
        return result.all()

    async def get_all_indicators(self) -> List[FinancialIndicator]:
        """Returns all financial indicators."""
        result = await self._db.execute(select(FinancialIndicator))
        return result.scalars().all()

    async def get_metric(
        self,
        indicator_id: int,
        report_date: Any,
        wil: Any,
        cab: Any,
        is_ajp: Any
    ) -> Optional[FinancialMetric]:
        """Finds an existing metric for a specific date and segment."""
        q = select(FinancialMetric).where(
            and_(
                FinancialMetric.indicator_id == indicator_id,
                FinancialMetric.report_date == report_date,
                FinancialMetric.wil == wil,
                FinancialMetric.cab == cab,
                FinancialMetric.is_ajp == is_ajp
            )
        )
        result = await self._db.execute(q)
        return result.scalars().first()

    def add(self, entity: Any) -> None:
        """Adds a new entity to the session."""
        self._db.add(entity)

    async def commit(self) -> None:
        """Commits the current session."""
        await self._db.commit()
