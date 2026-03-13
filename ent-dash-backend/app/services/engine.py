from sqlalchemy import select, desc, func, or_
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
    EngineStsProseRptHis
)

logger = logging.getLogger(__name__)

TABLE_MODELS = {
    "engine_job_entry_log": EngineJobEntryLog,
    "engine_job_log": EngineJobLog,
    "engine_process_group": EngineProcessGroup,
    "engine_process_group_his": EngineProcessGroupHis,
    "engine_sts_load_data": EngineStsLoadData,
    "engine_sts_load_data_his": EngineStsLoadDataHis,
    "engine_sts_proses_rpt": EngineStsProseRpt,
    "engine_sts_proses_rpt_his": EngineStsProseRptHis
}

async def get_dynamic_engine_data(db: AsyncSession, table_name: str, limit: int = 100) -> List[Dict[str, Any]]:
    if table_name not in TABLE_MODELS:
        raise ValueError(f"Unknown table_name: {table_name}")
        
    model = TABLE_MODELS[table_name]
    try:
        order_col = getattr(model, "id", None)
        if hasattr(model, "logdate"): order_col = model.logdate
        elif hasattr(model, "log_date"): order_col = model.log_date
        elif hasattr(model, "start_time"): order_col = model.start_time
        elif hasattr(model, "startdate"): order_col = model.startdate
            
        stmt = select(model)
        if order_col is not None:
             stmt = stmt.order_by(desc(order_col))
             
        stmt = stmt.limit(limit)
        result = await db.execute(stmt)
        rows = result.scalars().all()
        
        data = []
        for row in rows:
            row_dict = {}
            for column in row.__table__.columns:
                val = getattr(row, column.name)
                if hasattr(val, "isoformat"): val = val.isoformat()
                row_dict[column.name] = val
            data.append(row_dict)
        return data
    except Exception as e:
        logger.error(f"Error fetching dynamic engine data for {table_name}: {e}")
        raise

async def get_engine_logs(
    db: AsyncSession, 
    limit: int = 100,
    engine_name: str = "ALL",
    log_level: str = "ALL",
    module: str = "ALL",
    search_query: str = ""
) -> List[Dict[str, Any]]:
    """
    Fetches unified logs from engine_job_log and engine_sts_load_data_his.
    """
    try:
        # Fetch from EngineJobLog
        stmt_job = select(EngineJobLog).order_by(desc(EngineJobLog.logdate)).limit(limit)
        job_res = await db.execute(stmt_job)
        job_logs = job_res.scalars().all()

        # Fetch from EngineStsLoadDataHis
        stmt_his = select(EngineStsLoadDataHis).order_by(desc(EngineStsLoadDataHis.start_time)).limit(limit)
        his_res = await db.execute(stmt_his)
        his_logs = his_res.scalars().all()

        unified_logs = []

        for log in job_logs:
            # Map status to Level
            level = "INFO"
            status = (log.status or "").lower()
            if "error" in status or log.errors and log.errors > 0: level = "ERROR"
            elif "start" in status: level = "DEBUG"
            elif "warn" in status: level = "WARN"

            msg = log.log_field or f"Execution status: {log.status}"
            # Extract engine name from jobname (e.g. "qris_extraction" -> "qris")
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
                "historyTable": "engine_job_log"
            })

        for log in his_logs:
            level = "ERROR" if log.errors and log.errors > 0 else "INFO"
            if log.status_flag == 'E': level = "ERROR"
            elif log.status_flag == 'W': level = "WARN"
            
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
                "historyTable": "engine_sts_load_data_his"
            })

        # Sort combined logs by timestamp desc
        unified_logs.sort(key=lambda x: x["timestamp"], reverse=True)

        # Apply frontend-like filtering on backend
        filtered = []
        for l in unified_logs:
            if engine_name != "ALL" and engine_name.lower() not in l["engineName"].lower() and engine_name.lower() not in l["module"].lower():
                continue
            if log_level != "ALL" and log_level != l["level"]:
                continue
            if module != "ALL" and module.lower() not in l["module"].lower():
                continue
            if search_query:
                q = search_query.lower()
                if q not in l["message"].lower() and q not in l["runId"].lower() and q not in l["module"].lower():
                    continue
            filtered.append(l)

        return filtered[:limit]
    except Exception as e:
        logger.error(f"Error fetching unified engine logs: {e}")
        raise

async def get_engine_stats(db: AsyncSession) -> Dict[str, Any]:
    """
    Calculates statistics based on engine_sts_load_data_his and engine_job_log
    """
    try:
        # Total from his
        his_count_stmt = select(func.count(EngineStsLoadDataHis.id))
        his_count = await db.scalar(his_count_stmt) or 0
        
        job_count_stmt = select(func.count(EngineJobLog.id_job))
        job_count = await db.scalar(job_count_stmt) or 0
        
        total_logs = his_count + job_count

        # Errors
        err_stmt = select(func.count(EngineStsLoadDataHis.id)).where(EngineStsLoadDataHis.errors > 0)
        err_count = await db.scalar(err_stmt) or 0
        
        err_trend = round((err_count / total_logs * 100) if total_logs > 0 else 0, 1)

        # Most active engine
        active_stmt = select(EngineStsLoadDataHis.process_name, func.count(EngineStsLoadDataHis.id).label('c')) \
                      .group_by(EngineStsLoadDataHis.process_name) \
                      .order_by(desc('c')).limit(1)
        active_res = await db.execute(active_stmt)
        active_row = active_res.first()
        
        most_active_engine = active_row[0] if active_row else "qris"
        most_active_count = active_row[1] if active_row else 0
        most_active_percent = round((most_active_count / total_logs * 100) if total_logs > 0 else 0, 1)

        return {
            "totalLogs": total_logs,
            "errorTrend": err_trend,
            "warningCount": err_count, # Simplified warning logic
            "mostActiveEngine": most_active_engine,
            "mostActivePercent": most_active_percent
        }
    except Exception as e:
        logger.error(f"Error fetching engine stats: {e}")
        raise
