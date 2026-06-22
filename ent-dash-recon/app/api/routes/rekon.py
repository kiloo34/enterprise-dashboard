from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_db
from app.models.rekon import RekonQrisAj, RekonQrisRintis, RekonQrisOnus

router = APIRouter()

@router.get("/status", response_model=Dict[str, Any])
async def get_rekon_status() -> Any:
    return {"service": "Recon Service", "status": "active", "models_loaded": True}


# ─── Stats Endpoints ──────────────────────────────────────────────────────────

@router.get("/dashboard/aj-stats", response_model=Dict[str, Any])
async def get_aj_stats(db: AsyncSession = Depends(get_db)) -> Any:
    # Total count
    q_total = select(func.count(RekonQrisAj.id_row)).select_from(RekonQrisAj)
    total_count = await db.scalar(q_total) or 0

    # Settled (MATCH)
    q_settled = select(func.sum(RekonQrisAj.transaction_amount)).where(RekonQrisAj.status_rekon == 'MATCH')
    settled_amount = await db.scalar(q_settled) or 0.0

    # Unsettled (UNMATCH)
    q_unsettled = select(func.sum(RekonQrisAj.transaction_amount)).where(RekonQrisAj.status_rekon == 'UNMATCH')
    unsettled_amount = await db.scalar(q_unsettled) or 0.0

    return {
        "totalTransactions": total_count,
        "settledAmount": float(settled_amount),
        "unsettledAmount": float(unsettled_amount),
        "totalDiscrepancyAmount": float(unsettled_amount)
    }


@router.get("/dashboard/rintis-stats", response_model=Dict[str, Any])
async def get_rintis_stats(db: AsyncSession = Depends(get_db)) -> Any:
    q_total = select(func.count(RekonQrisRintis.id)).select_from(RekonQrisRintis)
    total_count = await db.scalar(q_total) or 0

    q_settled = select(func.sum(RekonQrisRintis.transaction_amount)).where(RekonQrisRintis.status_rekon == 'MATCH')
    settled_amount = await db.scalar(q_settled) or 0.0

    q_unsettled = select(func.sum(RekonQrisRintis.transaction_amount)).where(RekonQrisRintis.status_rekon == 'UNMATCH')
    unsettled_amount = await db.scalar(q_unsettled) or 0.0

    return {
        "totalTransactions": total_count,
        "settledAmount": float(settled_amount),
        "unsettledAmount": float(unsettled_amount),
        "totalDiscrepancyAmount": float(unsettled_amount)
    }


@router.get("/dashboard/onus-stats", response_model=Dict[str, Any])
async def get_onus_stats(db: AsyncSession = Depends(get_db)) -> Any:
    q_total = select(func.count(RekonQrisOnus.id)).select_from(RekonQrisOnus)
    total_count = await db.scalar(q_total) or 0

    q_settled = select(func.sum(RekonQrisOnus.transaction_amount)).where(RekonQrisOnus.status_rekon == 'MATCH')
    settled_amount = await db.scalar(q_settled) or 0.0

    q_unsettled = select(func.sum(RekonQrisOnus.transaction_amount)).where(RekonQrisOnus.status_rekon == 'UNMATCH')
    unsettled_amount = await db.scalar(q_unsettled) or 0.0

    return {
        "totalTransactions": total_count,
        "settledAmount": float(settled_amount),
        "unsettledAmount": float(unsettled_amount),
        "totalDiscrepancyAmount": float(unsettled_amount)
    }


# ─── Transactions Lists Endpoints ─────────────────────────────────────────────

@router.get("/dashboard/qris-transactions", response_model=Dict[str, Any])
async def get_qris_transactions(
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
) -> Any:
    # QRIS AJ mapped to qris-transactions
    q_total = select(func.count(RekonQrisAj.id_row)).select_from(RekonQrisAj)
    total = await db.scalar(q_total) or 0

    q_txs = select(RekonQrisAj).order_by(RekonQrisAj.transaction_date.desc()).offset(offset).limit(limit)
    res = await db.execute(q_txs)
    rows = res.scalars().all()

    txs_list = []
    for r in rows:
        ts_str = r.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if r.transaction_date else ""
        txs_list.append({
            "id": r.id_row,
            "timestamp": ts_str,
            "merchant": "Merchant Artajasa",
            "stan": r.id_row,
            "nominal": float(r.transaction_amount or 0),
            "bankStatus": "SUCCESS" if r.is_cbs else "FAILED",
            "artajasaStatus": "SUCCESS" if r.is_biller else "FAILED",
            "reconStatus": r.status_rekon or "UNMATCH"
        })

    return {"transactions": txs_list, "total": total}


@router.get("/dashboard/rintis-transactions", response_model=Dict[str, Any])
async def get_rintis_transactions(
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
) -> Any:
    q_total = select(func.count(RekonQrisRintis.id)).select_from(RekonQrisRintis)
    total = await db.scalar(q_total) or 0

    q_txs = select(RekonQrisRintis).order_by(RekonQrisRintis.transaction_date.desc()).offset(offset).limit(limit)
    res = await db.execute(q_txs)
    rows = res.scalars().all()

    txs_list = []
    for r in rows:
        ts_str = r.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if r.transaction_date else ""
        txs_list.append({
            "id": str(r.id),
            "timestamp": ts_str,
            "merchant": r.merchant_name or "Merchant Rintis",
            "stan": r.trace_no or r.invoice_number or "",
            "nominal": float(r.transaction_amount or 0),
            "bankStatus": "SUCCESS" if r.is_cbs else "FAILED",
            "artajasaStatus": "SUCCESS" if r.is_biller else "FAILED",
            "reconStatus": r.status_rekon or "UNMATCH"
        })

    return {"transactions": txs_list, "total": total}


@router.get("/dashboard/onus-transactions", response_model=Dict[str, Any])
async def get_onus_transactions(
    limit: int = Query(10, ge=1),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db)
) -> Any:
    q_total = select(func.count(RekonQrisOnus.id)).select_from(RekonQrisOnus)
    total = await db.scalar(q_total) or 0

    q_txs = select(RekonQrisOnus).order_by(RekonQrisOnus.transaction_date.desc()).offset(offset).limit(limit)
    res = await db.execute(q_txs)
    rows = res.scalars().all()

    txs_list = []
    for r in rows:
        ts_str = r.transaction_date.strftime("%Y-%m-%d %H:%M:%S") if r.transaction_date else ""
        txs_list.append({
            "id": str(r.id),
            "timestamp": ts_str,
            "merchant": r.merchant_name or "Merchant ONUS",
            "stan": r.ref_core or r.ref_biller or "",
            "nominal": float(r.transaction_amount or 0),
            "bankStatus": "SUCCESS" if r.is_cbs else "FAILED",
            "artajasaStatus": "SUCCESS" if r.is_biller else "FAILED",
            "reconStatus": r.status_rekon or "UNMATCH"
        })

    return {"transactions": txs_list, "total": total}


# ─── Manual Trigger Endpoint ──────────────────────────────────────────────────

@router.post("/reconcile/{network}", response_model=Dict[str, Any])
async def trigger_reconcile(network: str) -> Any:
    from app.tasks.reconciliation import (
        reconcile_qris_aj,
        reconcile_qris_rintis,
        reconcile_qris_onus,
    )
    if network == "aj":
        task = reconcile_qris_aj.delay()
    elif network == "rintis":
        task = reconcile_qris_rintis.delay()
    elif network == "onus":
        task = reconcile_qris_onus.delay()
    else:
        raise HTTPException(status_code=400, detail="Invalid network name. Choose 'aj', 'rintis', or 'onus'")

    return {"status": "triggered", "task_id": task.id}
