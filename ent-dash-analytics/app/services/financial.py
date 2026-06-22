"""
Financial Service — Business Logic Layer for ent-dash-analytics.

Implements OOP pattern: FinancialService encapsulates all dashboard
aggregation logic. SQL queries are delegated to FinancialRepository.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional, Any
from datetime import datetime

from app.crud.financial_repository import FinancialRepository
from app.models.financial import FinancialMetric


class FinancialService:
    """
    Orchestrates financial dashboard data retrieval and aggregation.
    Receives a DB session via constructor injection (OOP standard).
    Delegates all data access to FinancialRepository.
    """

    def __init__(self, db: AsyncSession):
        self._repo = FinancialRepository(db)

    async def get_financial_dashboard(
        self, category: Optional[str] = None
    ) -> tuple[List[Any], List[str]]:
        """
        Builds the financial dashboard payload:
        1. Fetch recent report dates via repository
        2. Fetch indicators joined with metrics via repository
        3. Group and aggregate metrics per indicator/segment
        4. Post-process CASA ratio relative to TOTAL_DPK
        Returns (metrics_list, date_labels)
        """
        dates = await self._repo.get_latest_report_dates(limit=5)
        latest_date = dates[0] if dates else datetime.now().date()

        rows = await self._repo.get_indicators_with_metrics(dates, category)

        grouped_data: dict = {}
        seen_indicators: dict = {}

        for ind, met in rows:
            seen_indicators[ind.id] = ind
            if not met:
                continue
            met.indicator = ind
            key = (ind.id, met.wil, met.cab, met.is_ajp)
            if key not in grouped_data:
                grouped_data[key] = []
            grouped_data[key].append(met)

        output: List[Any] = []

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
                for d in reversed(dates):
                    m_for_date = next((m for m in metrics if m.report_date == d), None)
                    history.append(
                        float(m_for_date.value)
                        if m_for_date and m_for_date.value is not None
                        else None
                    )

                latest_metric.history = history
                output.append(latest_metric)

        output = self._apply_casa_ratio(output, dates)
        date_labels = self._format_date_labels(dates)

        return output, date_labels

    # ------------------------------------------------------------------
    # Private helpers — pure business logic, no DB access
    # ------------------------------------------------------------------

    def _apply_casa_ratio(self, output: List[Any], dates: List[Any]) -> List[Any]:
        """Post-processes CASA metrics as a ratio of TOTAL_DPK."""
        total_dpk_map: dict = {}
        for met in output:
            if met.indicator.slug == "TOTAL_DPK":
                key = (met.report_date, met.wil, met.cab, met.is_ajp)
                total_dpk_map[key] = {
                    "value": met.value,
                    "history": met.history,
                    "target": met.target_nominal,
                }

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
                        dpk_h = dpk["history"][i] if i < len(dpk["history"]) else None
                        new_history.append(
                            (h_val / dpk_h) * 100
                            if h_val and dpk_h and dpk_h > 0
                            else None
                        )
                    met.history = new_history

        return output

    @staticmethod
    def _format_date_labels(dates: List[Any]) -> List[str]:
        """Converts date objects to human-readable month-day labels."""
        labels = []
        for d in reversed(dates):
            labels.append(d.strftime("%b %d") if hasattr(d, "strftime") else str(d))
        return labels
