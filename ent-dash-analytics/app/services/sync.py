"""
Sync Service — Orchestrates gRPC-based data synchronisation from Engine
to the Analytics database.

Implements OOP pattern: SyncService encapsulates all sync logic.
Data access (indicator lookup, metric upsert) is delegated to
FinancialRepository.
"""
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal
from app.models.dashboard import FinancialIndicator, FinancialMetric
from app.core.config import settings
from app.crud.financial_repository import FinancialRepository

from ent_dash_common.auth import generate_service_token
from ent_dash_common.grpc import engine_pb2
from app.core.grpc_client import get_engine_stub

logger = logging.getLogger(__name__)


class SyncService:
    """
    Triggers and orchestrates metric synchronisation from Engine via gRPC.
    Fetches aggregated data and persists it using FinancialRepository.
    """

    async def sync_dashboard_metrics(self) -> None:
        """
        Entry-point called by the Kafka consumer when `fact_kinerjaprc` updates.
        Fetches aggregated data from Engine gRPC and saves to Analytics DB.
        """
        logger.info("[Sync] Triggering sync_dashboard_metrics via gRPC")

        token = generate_service_token(settings.SECRET_KEY, settings.ALGORITHM)

        try:
            stub = get_engine_stub()
            request = engine_pb2.FactKinerjaRequest(token=token)
            response = await stub.GetFactKinerjaAggregate(request, timeout=30.0)

            if response.status != "success":
                logger.error(f"[Sync] Engine gRPC error: {response.message}")
                return
        except Exception as e:
            logger.error(f"[Sync] Failed to fetch aggregated data from Engine gRPC: {e}")
            return

        data_rows = response.data
        if not data_rows:
            logger.info("[Sync] No data received from Engine via gRPC.")
            return

        try:
            async with AsyncSessionLocal() as db:
                await self._persist_metrics(db, data_rows)
                logger.info("[Sync] Metrics successfully synced via gRPC.")
        except Exception as e:
            logger.error(f"[Sync] Failed to save metrics: {e}", exc_info=True)

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    async def _persist_metrics(self, db: AsyncSession, data_rows) -> None:
        """
        Maps gRPC data rows to FinancialMetric records and upserts them.
        Delegates all DB queries to FinancialRepository.
        """
        repo = FinancialRepository(db)
        indicators = await repo.get_all_indicators()
        indicator_map = {ind.slug.upper(): ind for ind in indicators}

        for row in data_rows:
            slug = row.keterangan.strip().upper()
            if not slug or slug not in indicator_map:
                continue

            indicator = indicator_map[slug]

            try:
                periode_data = datetime.strptime(row.periode_data, "%Y-%m-%d").date()
            except ValueError:
                continue

            # Update sparse indicator metadata
            self._update_indicator_metadata(indicator, row)

            value = self._resolve_value(indicator, row)

            metric = await repo.get_metric(
                indicator_id=indicator.id,
                report_date=periode_data,
                wil=row.wil,
                cab=row.cab,
                is_ajp=row.is_ajp,
            )

            if metric:
                metric.value = value
            else:
                repo.add(FinancialMetric(
                    indicator_id=indicator.id,
                    report_date=periode_data,
                    wil=row.wil,
                    nama_wil=row.nama_wil,
                    cab=row.cab,
                    nama_cab=row.nama_cab,
                    is_ajp=row.is_ajp,
                    value=value,
                ))

        await repo.commit()

    @staticmethod
    def _update_indicator_metadata(indicator: FinancialIndicator, row) -> None:
        """Fills in missing indicator metadata from gRPC row data."""
        if not indicator.kelompok and row.kelompok:
            indicator.kelompok = row.kelompok
        if not indicator.jenis and row.jenis:
            indicator.jenis = row.jenis
        if not indicator.urut and row.urut:
            indicator.urut = row.urut

    @staticmethod
    def _resolve_value(indicator: FinancialIndicator, row) -> float:
        """Returns the appropriate numeric value based on indicator type."""
        total_nominal = row.total_nominal or 0.0
        avg_rasio = row.avg_rasio or 0.0
        return float(avg_rasio) if indicator.is_ratio else float(total_nominal)
