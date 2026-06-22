import logging
from jose import jwt
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import AsyncSessionLocal
from app.models.dashboard import FinancialIndicator, FinancialMetric
from app.core.config import settings

logger = logging.getLogger(__name__)

from ent_dash_common.auth import generate_service_token
from ent_dash_common.grpc import engine_pb2
from app.core.grpc_client import get_engine_stub

async def sync_dashboard_metrics_from_engine():
    """
    Called by the Kafka consumer when `fact_kinerjaprc` is updated.
    Fetches aggregated data from the Engine gRPC API and saves it to the Analytics DB.
    """
    logger.info("[Sync] Triggering sync_dashboard_metrics_from_engine() via gRPC")

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

    # Database insertion
    try:
        async with AsyncSessionLocal() as db:
            await _process_and_save_metrics_grpc(db, data_rows)
            logger.info("[Sync] Metrics successfully synced to Analytics database via gRPC.")
    except Exception as e:
        logger.error(f"[Sync] Failed to save metrics: {e}", exc_info=True)


async def _process_and_save_metrics_grpc(db: AsyncSession, data_rows):
    # Fetch indicators to map slug -> ID
    result = await db.execute(select(FinancialIndicator))
    indicators = result.scalars().all()
    indicator_map = {ind.slug.upper(): ind.id for ind in indicators}

    for row in data_rows:
        slug = row.keterangan.strip().upper()
        if not slug or slug not in indicator_map:
            continue
            
        indicator_id = indicator_map[slug]
        indicator = next(i for i in indicators if i.id == indicator_id)
        
        # Format the date back from ISO string
        try:
            periode_data = datetime.strptime(row.periode_data, "%Y-%m-%d").date()
        except ValueError:
            continue
            
        # Update indicator metadata if missing
        kelompok = row.kelompok
        jenis = row.jenis
        urut = row.urut
        wil = row.wil
        cab = row.cab
        is_ajp = row.is_ajp
        
        if not indicator.kelompok and kelompok: indicator.kelompok = kelompok
        if not indicator.jenis and jenis: indicator.jenis = jenis
        if not indicator.urut and urut: indicator.urut = urut
        
        # Check if metric already exists for this date, indicator, and segment (Wil/Cab)
        q_metric = select(FinancialMetric).where(
            and_(
                FinancialMetric.indicator_id == indicator_id,
                FinancialMetric.report_date == periode_data,
                FinancialMetric.wil == wil,
                FinancialMetric.cab == cab,
                FinancialMetric.is_ajp == is_ajp
            )
        )
        metric_result = await db.execute(q_metric)
        metric = metric_result.scalars().first()
        
        total_nominal = row.total_nominal or 0.0
        avg_rasio = row.avg_rasio or 0.0
        value = float(avg_rasio) if indicator.is_ratio else float(total_nominal)

        if metric:
            metric.value = value
        else:
            metric = FinancialMetric(
                indicator_id=indicator_id,
                report_date=periode_data,
                wil=wil,
                nama_wil=row.nama_wil,
                cab=cab,
                nama_cab=row.nama_cab,
                is_ajp=is_ajp,
                value=value
            )
            db.add(metric)
            
    await db.commit()
