from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, List
import logging
from datetime import datetime

from app.models.engine import (
    EngineJobEntryLog,
    EngineJobLog,
    EngineProcessGroup,
    EngineProcessGroupHis,
    EngineStsLoadData,
    EngineStsLoadDataHis,
    EngineStsProseRpt,
    EngineStsProseRptHis,
)

logger = logging.getLogger(__name__)

_TABLE_MODELS: Dict[str, Any] = {
    "engine_job_entry_log": EngineJobEntryLog,
    "engine_job_log": EngineJobLog,
    "engine_process_group": EngineProcessGroup,
    "engine_process_group_his": EngineProcessGroupHis,
    "engine_sts_load_data": EngineStsLoadData,
    "engine_sts_load_data_his": EngineStsLoadDataHis,
    "engine_sts_proses_rpt": EngineStsProseRpt,
    "engine_sts_proses_rpt_his": EngineStsProseRptHis,
}


class EngineMonitoringService:
    """Service for querying engine monitoring tables in the CBSKONV database."""

    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_dynamic_data(self, table_name: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch raw rows from a dynamically specified engine table."""
        if table_name not in _TABLE_MODELS:
            raise ValueError(f"Unknown table_name: {table_name}")

        model = _TABLE_MODELS[table_name]
        try:
            order_col = getattr(model, "id", None)
            if hasattr(model, "logdate"):
                order_col = model.logdate
            elif hasattr(model, "log_date"):
                order_col = model.log_date
            elif hasattr(model, "start_time"):
                order_col = model.start_time
            elif hasattr(model, "startdate"):
                order_col = model.startdate

            stmt = select(model)
            if order_col is not None:
                stmt = stmt.order_by(desc(order_col))
            stmt = stmt.limit(limit)

            result = await self._db.execute(stmt)
            rows = result.scalars().all()

            data = []
            for row in rows:
                row_dict = {}
                for column in row.__table__.columns:
                    val = getattr(row, column.name)
                    if hasattr(val, "isoformat"):
                        val = val.isoformat()
                    row_dict[column.name] = val
                data.append(row_dict)
            return data
        except Exception as e:
            logger.error(f"Error fetching dynamic engine data for {table_name}: {e}")
            raise

    async def get_logs(
        self,
        limit: int = 100,
        engine_name: str = "ALL",
        log_level: str = "ALL",
        module: str = "ALL",
        search_query: str = "",
    ) -> List[Dict[str, Any]]:
        """Fetch unified logs from engine_job_log and engine_sts_load_data_his."""
        try:
            stmt_job = select(EngineJobLog).order_by(desc(EngineJobLog.logdate)).limit(limit)
            job_res = await self._db.execute(stmt_job)
            job_logs = job_res.scalars().all()

            stmt_his = (
                select(EngineStsLoadDataHis)
                .order_by(desc(EngineStsLoadDataHis.start_time))
                .limit(limit)
            )
            his_res = await self._db.execute(stmt_his)
            his_logs = his_res.scalars().all()

            unified_logs = []

            for log in job_logs:
                level = "INFO"
                status = (log.status or "").lower()
                if "error" in status or (log.errors and log.errors > 0):
                    level = "ERROR"
                elif "start" in status:
                    level = "DEBUG"
                elif "warn" in status:
                    level = "WARN"

                msg = log.log_field or f"Execution status: {log.status}"
                e_name = log.jobname.split("_")[0] if log.jobname else "unknown"

                unified_logs.append({
                    "id": f"JOB-{log.id_job}",
                    "timestamp": log.logdate.isoformat() if log.logdate else datetime.now().isoformat(),
                    "engineName": e_name,
                    "runId": f"RUN-{log.id_job}",
                    "level": level,
                    "message": msg,
                    "module": log.jobname or "Unknown",
                    "tableName": "engine_job_log",
                    "historyTable": "engine_job_log",
                })

            for log in his_logs:
                level = "ERROR" if (log.errors and log.errors > 0) else "INFO"
                if log.status_flag == "E":
                    level = "ERROR"
                elif log.status_flag == "W":
                    level = "WARN"

                msg = log.status_desc or (log.log_field if log.log_field else f"Completed with {log.errors or 0} errors")
                e_name = log.process_name.split("_")[0] if log.process_name else "system"

                unified_logs.append({
                    "id": f"HIS-{log.id}",
                    "timestamp": log.start_time.isoformat() if log.start_time else datetime.now().isoformat(),
                    "engineName": e_name,
                    "runId": f"GRP-{log.group_id or log.id}",
                    "level": level,
                    "message": msg,
                    "module": log.process_name or "Load Data",
                    "tableName": "engine_sts_load_data",
                    "historyTable": "engine_sts_load_data_his",
                })

            unified_logs.sort(key=lambda x: x["timestamp"], reverse=True)

            filtered = []
            for entry in unified_logs:
                if engine_name != "ALL" and engine_name.lower() not in entry["engineName"].lower() and engine_name.lower() not in entry["module"].lower():
                    continue
                if log_level != "ALL" and log_level != entry["level"]:
                    continue
                if module != "ALL" and module.lower() not in entry["module"].lower():
                    continue
                if search_query:
                    q = search_query.lower()
                    if q not in entry["message"].lower() and q not in entry["runId"].lower() and q not in entry["module"].lower():
                        continue
                filtered.append(entry)

            return filtered[:limit]
        except Exception as e:
            logger.error(f"Error fetching unified engine logs: {e}")
            raise

    async def get_stats(self) -> Dict[str, Any]:
        """Return aggregated engine processing statistics."""
        try:
            his_count = await self._db.scalar(select(func.count(EngineStsLoadDataHis.id))) or 0
            job_count = await self._db.scalar(select(func.count(EngineJobLog.id_job))) or 0
            total_logs = his_count + job_count

            err_count = await self._db.scalar(
                select(func.count(EngineStsLoadDataHis.id)).where(EngineStsLoadDataHis.errors > 0)
            ) or 0
            err_trend = round((err_count / total_logs * 100) if total_logs > 0 else 0, 1)

            active_stmt = (
                select(EngineStsLoadDataHis.process_name, func.count(EngineStsLoadDataHis.id).label("c"))
                .group_by(EngineStsLoadDataHis.process_name)
                .order_by(desc("c"))
                .limit(1)
            )
            active_row = (await self._db.execute(active_stmt)).first()
            most_active_engine = active_row[0] if active_row else "qris"
            most_active_count = active_row[1] if active_row else 0
            most_active_percent = round((most_active_count / total_logs * 100) if total_logs > 0 else 0, 1)

            return {
                "totalLogs": total_logs,
                "errorTrend": err_trend,
                "warningCount": err_count,
                "mostActiveEngine": most_active_engine,
                "mostActivePercent": most_active_percent,
            }
        except Exception as e:
            logger.error(f"Error fetching engine stats: {e}")
            raise
