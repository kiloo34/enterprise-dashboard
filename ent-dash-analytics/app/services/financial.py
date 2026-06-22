from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Any
from app.models.financial import FinancialMetric, FinancialIndicator


async def get_financial_dashboard(db: AsyncSession, category: Optional[str] = None) -> List[Any]:
    # 1. Find the latest 5 report dates
    dates_result = await db.execute(
        select(FinancialMetric.report_date)
        .distinct()
        .order_by(FinancialMetric.report_date.desc())
        .limit(5)
    )
    all_dates = [r[0] for r in dates_result.all()]
    
    from datetime import datetime
    latest_date = all_dates[0] if all_dates else datetime.now().date()

    # 2. Fetch ALL indicators and left join with metrics for all 5 dates
    query = select(FinancialIndicator, FinancialMetric)
    if all_dates:
        query = query.outerjoin(
            FinancialMetric,
            and_(
                FinancialMetric.indicator_id == FinancialIndicator.id,
                FinancialMetric.report_date.in_(all_dates)
            )
        ).order_by(FinancialIndicator.urut, FinancialMetric.report_date.asc())
    else:
        query = query.outerjoin(
            FinancialMetric,
            FinancialMetric.id == -1
        ).order_by(FinancialIndicator.urut)


    query = query.where(FinancialIndicator.is_visible == True, FinancialIndicator.deleted_at == None)

    if category:
        query = query.where(FinancialIndicator.category == category)

    result = await db.execute(query)
    rows = result.all()

    # Group metrics by Indicator & Segment
    grouped_data = {}
    seen_indicators = {}

    for ind, met in rows:
        seen_indicators[ind.id] = ind
        if not met:
            continue
        met.indicator = ind
        key = (ind.id, met.wil, met.cab, met.is_ajp)
        if key not in grouped_data:
            grouped_data[key] = []
        grouped_data[key].append(met)

    output = []

    for ind_id, ind in seen_indicators.items():
        ind_keys = [k for k in grouped_data.keys() if k[0] == ind_id]

        if not ind_keys:
            mock_met = FinancialMetric(indicator=ind, report_date=latest_date, value=None)
            mock_met.history = []
            output.append(mock_met)
            continue

        for key in ind_keys:
            metrics = grouped_data[key]
            latest_metric = next((m for m in metrics if m.report_date == latest_date), None)

            if not latest_metric:
                latest_metric = metrics[0]

            history = []
            for d in reversed(all_dates):
                m_for_date = next((m for m in metrics if m.report_date == d), None)
                history.append(float(m_for_date.value) if m_for_date and m_for_date.value is not None else None)

            latest_metric.history = history
            output.append(latest_metric)

    # Post-process CASA ratios relative to TOTAL_DPK
    total_dpk_map = {}
    for met in output:
        if met.indicator.slug == "TOTAL_DPK":
            key = (met.report_date, met.wil, met.cab, met.is_ajp)
            total_dpk_map[key] = {"value": met.value, "history": met.history, "target": met.target_nominal}

    for met in output:
        if met.indicator.slug == "CASA":
            key = (met.report_date, met.wil, met.cab, met.is_ajp)
            dpk = total_dpk_map.get(key)
            if dpk and dpk["value"] and dpk["value"] > 0:
                met.value = (met.value / dpk["value"]) * 100 if met.value else 0
                if met.target_nominal and dpk["target"] and dpk["target"] > 0:
                    met.target_nominal = (met.target_nominal / dpk["target"]) * 100
                new_history = []
                for i, h_val in enumerate(met.history):
                    dpk_h_val = dpk["history"][i] if i < len(dpk["history"]) else None
                    new_history.append((h_val / dpk_h_val) * 100 if h_val and dpk_h_val and dpk_h_val > 0 else None)
                met.history = new_history

    all_dates_str = []
    for d in reversed(all_dates):
        if hasattr(d, "strftime"):
            all_dates_str.append(d.strftime("%b %d"))
        else:
            all_dates_str.append(str(d))
    
    return output, all_dates_str
