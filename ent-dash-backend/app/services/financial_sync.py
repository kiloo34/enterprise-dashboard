from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_
from app.models.dashboard import FinancialIndicator, FinancialMetric
from app.models.tableau import FactKinerjaPrc
from datetime import date
from typing import Optional, List

async def sync_metrics_from_fact_kinerja(db: AsyncSession, periode_data: Optional[date] = None):
    """
    Synchronizes financial metrics from fact_kinerjaprc table to financial_metrics table.
    If periode_data is None, it syncs the latest available date in FactKinerjaPrc.
    """
    if not periode_data:
        # Get latest date from FactKinerjaPrc
        result = await db.execute(select(func.max(FactKinerjaPrc.periode_data)))
        periode_data = result.scalar()
        
    if not periode_data:
        return

    # Fetch indicators to map keterangan to indicator_id
    result = await db.execute(select(FinancialIndicator))
    indicators = result.scalars().all()
    # Map by slug (which matches keterangan in uppercase)
    indicator_map = {ind.slug.upper(): ind.id for ind in indicators}

    # Fetch data from FactKinerjaPrc for specified date
    # We aggregate by keterangan for the target date
    # Note: FactKinerjaPrc might have multiple rows (wil, cab), we need to decide aggregation.
    # Usually, if wil/cab is null it might be the total. 
    # Let's assume we want the total for each keterangan.
    
    query = (
        select(
            FactKinerjaPrc.keterangan,
            FactKinerjaPrc.kelompok,
            FactKinerjaPrc.jenis,
            FactKinerjaPrc.urut,
            FactKinerjaPrc.wil,
            FactKinerjaPrc.nama_wil,
            FactKinerjaPrc.cab,
            FactKinerjaPrc.nama_cab,
            FactKinerjaPrc.is_ajp,
            func.sum(FactKinerjaPrc.nominal).label("total_nominal"),
            func.avg(FactKinerjaPrc.rasio).label("avg_rasio")
        )
        .where(FactKinerjaPrc.periode_data == periode_data)
        .group_by(
            FactKinerjaPrc.keterangan,
            FactKinerjaPrc.kelompok,
            FactKinerjaPrc.jenis,
            FactKinerjaPrc.urut,
            FactKinerjaPrc.wil,
            FactKinerjaPrc.nama_wil,
            FactKinerjaPrc.cab,
            FactKinerjaPrc.nama_cab,
            FactKinerjaPrc.is_ajp
        )
    )
    
    result = await db.execute(query)
    rows = result.all()

    for row in rows:
        slug = row.keterangan.strip().upper() if row.keterangan else None
        if not slug or slug not in indicator_map:
            continue
            
        indicator_id = indicator_map[slug]
        indicator = next(i for i in indicators if i.id == indicator_id)
        
        # Update indicator metadata if missing
        if not indicator.kelompok: indicator.kelompok = row.kelompok
        if not indicator.jenis: indicator.jenis = row.jenis
        if not indicator.urut: indicator.urut = row.urut
        
        # Check if metric already exists for this date, indicator, and segment (Wil/Cab)
        q_metric = select(FinancialMetric).where(
            and_(
                FinancialMetric.indicator_id == indicator_id,
                FinancialMetric.report_date == periode_data,
                FinancialMetric.wil == row.wil,
                FinancialMetric.cab == row.cab,
                FinancialMetric.is_ajp == row.is_ajp
            )
        )
        metric_result = await db.execute(q_metric)
        metric = metric_result.scalars().first()
        
        value = float(row.avg_rasio or 0) if indicator.is_ratio else float(row.total_nominal or 0)

        if metric:
            metric.value = value
        else:
            metric = FinancialMetric(
                indicator_id=indicator_id,
                report_date=periode_data,
                wil=row.wil,
                nama_wil=row.nama_wil,
                cab=row.cab,
                nama_cab=row.nama_cab,
                is_ajp=row.is_ajp,
                value=value
            )
            db.add(metric)
            
    await db.commit()
