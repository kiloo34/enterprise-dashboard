import pandas as pd
import logging
from datetime import date, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.worker import celery_app
from app.core.config import settings

logger = logging.getLogger(__name__)

# Single DB connection — cbskonv owns all rekon.* tables
_recon_db = create_engine(
    settings.sync_database_uri,
    pool_pre_ping=True
)

ReconSession = sessionmaker(bind=_recon_db)


@celery_app.task(bind=True, name="tasks.reconcile_qris_aj", max_retries=3, default_retry_delay=60)
def reconcile_qris_aj(self):
    logger.info("[Recon] Starting QRIS Artajasa reconciliation task...")
    try:
        # Load raw data from engine database with date filter and row limit
        since = date.today() - timedelta(days=settings.RECON_LOOKBACK_DAYS)
        with _recon_db.connect() as conn:
            df = pd.read_sql(
                text(
                    "SELECT * FROM rekon.rekon_qris_aj "
                    "WHERE transaction_date >= :since "
                    "LIMIT :max_rows"
                ),
                conn,
                params={"since": since, "max_rows": settings.RECON_MAX_ROWS},
            )
        if len(df) >= settings.RECON_MAX_ROWS:
            logger.warning(
                f"[Recon AJ] Result truncated at {settings.RECON_MAX_ROWS} rows. "
                "Consider reducing RECON_LOOKBACK_DAYS or increasing RECON_MAX_ROWS."
            )

        if df.empty:
            logger.info("[Recon] No Artajasa transactions found in engine database.")
            # Clear target recon table anyway
            with ReconSession() as session:
                session.execute(text("DELETE FROM rekon.rekon_qris_aj"))
                session.commit()
            return {"status": "success", "processed_rows": 0}

        # Fill missing values
        df['is_cbs'] = df['is_cbs'].fillna(False).astype(bool)
        df['is_biller'] = df['is_biller'].fillna(False).astype(bool)
        df['is_ebiller'] = df['is_ebiller'].fillna(False).astype(bool)
        df['transaction_amount'] = pd.to_numeric(df['transaction_amount'], errors='coerce').fillna(0.0)
        
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        df['date_key'] = df['transaction_date'].dt.date
        
        def clean_ref(val):
            if not isinstance(val, str):
                return ""
            v = val.strip().lower()
            for prefix in ['cbs_', 'biller_', 'ebiller_', 'ebill_']:
                if v.startswith(prefix):
                    v = v[len(prefix):]
            return v

        df['clean_id'] = df['id_row'].apply(clean_ref)

        reconciled_records = []
        grouped = df.groupby(['clean_id', 'transaction_amount', 'date_key'])
        
        for keys, group in grouped:
            clean_id, amount, date_key = keys
            if not clean_id or amount == 0:
                for _, row in group.iterrows():
                    reconciled_records.append({
                        "id_row": row['id_row'],
                        "transaction_date": row['transaction_date'],
                        "report_datetime": row['report_datetime'],
                        "transaction_amount": row['transaction_amount'],
                        "interchange_fee": row['interchange_fee'],
                        "convenience_fee": row['convenience_fee'],
                        "merchant_mdr": row['merchant_mdr'],
                        "is_cbs": row['is_cbs'],
                        "is_biller": row['is_biller'],
                        "is_ebiller": row['is_ebiller'],
                        "status_rekon": "UNMATCH"
                    })
                continue
            
            is_cbs = group['is_cbs'].any()
            is_biller = group['is_biller'].any()
            is_ebiller = group['is_ebiller'].any()
            
            status_rekon = "MATCH" if (is_cbs and is_biller and is_ebiller) else "UNMATCH"
            
            primary_row = group[group['is_cbs']].head(1)
            if primary_row.empty:
                primary_row = group[group['is_ebiller']].head(1)
            if primary_row.empty:
                primary_row = group.head(1)
                
            row = primary_row.iloc[0]
            
            reconciled_records.append({
                "id_row": row['id_row'],
                "transaction_date": row['transaction_date'],
                "report_datetime": row['report_datetime'],
                "transaction_amount": amount,
                "interchange_fee": row['interchange_fee'],
                "convenience_fee": row['convenience_fee'],
                "merchant_mdr": row['merchant_mdr'],
                "is_cbs": bool(is_cbs),
                "is_biller": bool(is_biller),
                "is_ebiller": bool(is_ebiller),
                "status_rekon": status_rekon
            })
            
        with ReconSession() as session:
            session.execute(text("DELETE FROM rekon.rekon_qris_aj"))
            session.commit()
            
            if reconciled_records:
                session.execute(
                    text("""
                        INSERT INTO rekon.rekon_qris_aj 
                        (id_row, transaction_date, report_datetime, transaction_amount, interchange_fee, convenience_fee, merchant_mdr, is_biller, is_ebiller, is_cbs, status_rekon)
                        VALUES (:id_row, :transaction_date, :report_datetime, :transaction_amount, :interchange_fee, :convenience_fee, :merchant_mdr, :is_biller, :is_ebiller, :is_cbs, :status_rekon)
                    """),
                    reconciled_records
                )
                session.commit()
                
        logger.info(f"[Recon] Reconciled {len(reconciled_records)} transactions for Artajasa.")
        return {"status": "success", "processed_rows": len(reconciled_records)}
        
    except Exception as exc:
        logger.error(f"[Recon] Task failed for Artajasa: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, name="tasks.reconcile_qris_rintis", max_retries=3, default_retry_delay=60)
def reconcile_qris_rintis(self):
    logger.info("[Recon] Starting QRIS Rintis reconciliation task...")
    try:
        since = date.today() - timedelta(days=settings.RECON_LOOKBACK_DAYS)
        with _recon_db.connect() as conn:
            df = pd.read_sql(
                text(
                    "SELECT * FROM rekon.rekon_qris_rintis "
                    "WHERE transaction_date >= :since "
                    "LIMIT :max_rows"
                ),
                conn,
                params={"since": since, "max_rows": settings.RECON_MAX_ROWS},
            )
        if len(df) >= settings.RECON_MAX_ROWS:
            logger.warning(
                f"[Recon Rintis] Result truncated at {settings.RECON_MAX_ROWS} rows. "
                "Consider reducing RECON_LOOKBACK_DAYS or increasing RECON_MAX_ROWS."
            )

        if df.empty:
            logger.info("[Recon] No Rintis transactions found in engine database.")
            with ReconSession() as session:
                session.execute(text("DELETE FROM rekon.rekon_qris_rintis"))
                session.commit()
            return {"status": "success", "processed_rows": 0}

        df['is_cbs'] = df['is_cbs'].fillna(False).astype(bool)
        df['is_biller'] = df['is_biller'].fillna(False).astype(bool)
        df['is_echannel'] = df['is_echannel'].fillna(False).astype(bool)
        df['transaction_amount'] = pd.to_numeric(df['transaction_amount'], errors='coerce').fillna(0.0)
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        df['date_key'] = df['transaction_date'].dt.date

        def clean_ref(val):
            if not isinstance(val, str):
                return ""
            v = val.strip().lower()
            for prefix in ['cbs_', 'biller_', 'echannel_', 'rintis_']:
                if v.startswith(prefix):
                    v = v[len(prefix):]
            return v

        df['clean_ref_core'] = df['ref_core'].apply(clean_ref)
        df['clean_ref_biller'] = df['ref_biller'].apply(clean_ref)
        df['clean_invoice'] = df['invoice_number'].apply(clean_ref)
        df['clean_trace'] = df['trace_no'].apply(clean_ref)

        def get_clean_id(row):
            for field in ['clean_ref_core', 'clean_ref_biller', 'clean_invoice', 'clean_trace']:
                if row[field]:
                    return row[field]
            return ""

        df['clean_id'] = df.apply(get_clean_id, axis=1)

        reconciled_records = []
        grouped = df.groupby(['clean_id', 'transaction_amount', 'date_key'])

        for keys, group in grouped:
            clean_id, amount, date_key = keys
            if not clean_id or amount == 0:
                for _, row in group.iterrows():
                    reconciled_records.append({
                        "ref_core": row['ref_core'],
                        "ref_biller": row['ref_biller'],
                        "invoice_number": row['invoice_number'],
                        "merchant_pan": row['merchant_pan'],
                        "customer_pan": row['customer_pan'],
                        "merchant_name": row['merchant_name'],
                        "merchant_location": row['merchant_location'],
                        "transaction_date": row['transaction_date'],
                        "transaction_amount": row['transaction_amount'],
                        "description": row['description'],
                        "jenis": row['jenis'],
                        "auth_resp": row['auth_resp'],
                        "trace_no": row['trace_no'],
                        "status": row['status'],
                        "qris_switching": row['qris_switching'],
                        "response_code": row['response_code'],
                        "interchange_fee": row['interchange_fee'],
                        "convenience_fee": row['convenience_fee'],
                        "institution": row['institution'],
                        "merchant_criteria": row['merchant_criteria'],
                        "trx_code": row['trx_code'],
                        "issuer_name": row['issuer_name'],
                        "acq_name": row['acq_name'],
                        "merchant_mdr": row['merchant_mdr'],
                        "is_cbs": row['is_cbs'],
                        "is_biller": row['is_biller'],
                        "is_echannel": row['is_echannel'],
                        "porefn": row['porefn'],
                        "desc_core": row['desc_core'],
                        "rekening_sumber": row['rekening_sumber'],
                        "rekening_nasabah": row['rekening_nasabah'],
                        "potecn": row['potecn'],
                        "pobchn": row['pobchn'],
                        "podtpo": row['podtpo'],
                        "potime": row['potime'],
                        "poprog": row['poprog'],
                        "bic": row['bic'],
                        "report_date": row['report_date'],
                        "status_rekon": "UNMATCH"
                    })
                continue

            is_cbs = group['is_cbs'].any()
            is_biller = group['is_biller'].any()
            is_echannel = group['is_echannel'].any()

            status_rekon = "MATCH" if (is_cbs and is_biller and is_echannel) else "UNMATCH"

            primary_row = group[group['is_cbs']].head(1)
            if primary_row.empty:
                primary_row = group[group['is_echannel']].head(1)
            if primary_row.empty:
                primary_row = group.head(1)

            row = primary_row.iloc[0]

            reconciled_records.append({
                "ref_core": row['ref_core'],
                "ref_biller": row['ref_biller'],
                "invoice_number": row['invoice_number'],
                "merchant_pan": row['merchant_pan'],
                "customer_pan": row['customer_pan'],
                "merchant_name": row['merchant_name'],
                "merchant_location": row['merchant_location'],
                "transaction_date": row['transaction_date'],
                "transaction_amount": amount,
                "description": row['description'],
                "jenis": row['jenis'],
                "auth_resp": row['auth_resp'],
                "trace_no": row['trace_no'],
                "status": row['status'],
                "qris_switching": row['qris_switching'],
                "response_code": row['response_code'],
                "interchange_fee": row['interchange_fee'],
                "convenience_fee": row['convenience_fee'],
                "institution": row['institution'],
                "merchant_criteria": row['merchant_criteria'],
                "trx_code": row['trx_code'],
                "issuer_name": row['issuer_name'],
                "acq_name": row['acq_name'],
                "merchant_mdr": row['merchant_mdr'],
                "is_cbs": bool(is_cbs),
                "is_biller": bool(is_biller),
                "is_echannel": bool(is_echannel),
                "porefn": row['porefn'],
                "desc_core": row['desc_core'],
                "rekening_sumber": row['rekening_sumber'],
                "rekening_nasabah": row['rekening_nasabah'],
                "potecn": row['potecn'],
                "pobchn": row['pobchn'],
                "podtpo": row['podtpo'],
                "potime": row['potime'],
                "poprog": row['poprog'],
                "bic": row['bic'],
                "report_date": row['report_date'],
                "status_rekon": status_rekon
            })

        with ReconSession() as session:
            session.execute(text("DELETE FROM rekon.rekon_qris_rintis"))
            session.commit()
            if reconciled_records:
                session.execute(
                    text("""
                        INSERT INTO rekon.rekon_qris_rintis 
                        (ref_core, ref_biller, invoice_number, merchant_pan, customer_pan, merchant_name, merchant_location, transaction_date, transaction_amount, description, jenis, auth_resp, trace_no, status, qris_switching, response_code, interchange_fee, convenience_fee, institution, merchant_criteria, trx_code, issuer_name, acq_name, merchant_mdr, is_biller, is_echannel, is_cbs, porefn, desc_core, rekening_sumber, rekening_nasabah, potecn, pobchn, podtpo, potime, poprog, bic, report_date, status_rekon)
                        VALUES (:ref_core, :ref_biller, :invoice_number, :merchant_pan, :customer_pan, :merchant_name, :merchant_location, :transaction_date, :transaction_amount, :description, :jenis, :auth_resp, :trace_no, :status, :qris_switching, :response_code, :interchange_fee, :convenience_fee, :institution, :merchant_criteria, :trx_code, :issuer_name, :acq_name, :merchant_mdr, :is_biller, :is_echannel, :is_cbs, :porefn, :desc_core, :rekening_sumber, :rekening_nasabah, :potecn, :pobchn, :podtpo, :potime, :poprog, :bic, :report_date, :status_rekon)
                    """),
                    reconciled_records
                )
                session.commit()

        logger.info(f"[Recon] Reconciled {len(reconciled_records)} transactions for Rintis.")
        return {"status": "success", "processed_rows": len(reconciled_records)}

    except Exception as exc:
        logger.error(f"[Recon] Task failed for Rintis: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(bind=True, name="tasks.reconcile_qris_onus", max_retries=3, default_retry_delay=60)
def reconcile_qris_onus(self):
    logger.info("[Recon] Starting QRIS ONUS reconciliation task...")
    try:
        since = date.today() - timedelta(days=settings.RECON_LOOKBACK_DAYS)
        with _recon_db.connect() as conn:
            df = pd.read_sql(
                text(
                    "SELECT * FROM rekon.rekon_qris_onus "
                    "WHERE transaction_date >= :since "
                    "LIMIT :max_rows"
                ),
                conn,
                params={"since": since, "max_rows": settings.RECON_MAX_ROWS},
            )
        if len(df) >= settings.RECON_MAX_ROWS:
            logger.warning(
                f"[Recon ONUS] Result truncated at {settings.RECON_MAX_ROWS} rows. "
                "Consider reducing RECON_LOOKBACK_DAYS or increasing RECON_MAX_ROWS."
            )

        if df.empty:
            logger.info("[Recon] No ONUS transactions found in engine database.")
            with ReconSession() as session:
                session.execute(text("DELETE FROM rekon.rekon_qris_onus"))
                session.commit()
            return {"status": "success", "processed_rows": 0}

        df['is_cbs'] = df['is_cbs'].fillna(False).astype(bool)
        df['is_biller'] = df['is_biller'].fillna(False).astype(bool)
        df['is_echannel'] = df['is_echannel'].fillna(False).astype(bool)
        df['transaction_amount'] = pd.to_numeric(df['transaction_amount'], errors='coerce').fillna(0.0)
        df['transaction_date'] = pd.to_datetime(df['transaction_date'])
        df['date_key'] = df['transaction_date'].dt.date

        def clean_ref(val):
            if not isinstance(val, str):
                return ""
            v = val.strip().lower()
            for prefix in ['cbs_', 'biller_', 'echannel_', 'onus_']:
                if v.startswith(prefix):
                    v = v[len(prefix):]
            return v

        df['clean_ref_core'] = df['ref_core'].apply(clean_ref)
        df['clean_ref_biller'] = df['ref_biller'].apply(clean_ref)
        df['clean_porefn'] = df['porefn'].apply(clean_ref)

        def get_clean_id(row):
            for field in ['clean_ref_core', 'clean_ref_biller', 'clean_porefn']:
                if row[field]:
                    return row[field]
            return ""

        df['clean_id'] = df.apply(get_clean_id, axis=1)

        reconciled_records = []
        grouped = df.groupby(['clean_id', 'transaction_amount', 'date_key'])

        for keys, group in grouped:
            clean_id, amount, date_key = keys
            if not clean_id or amount == 0:
                for _, row in group.iterrows():
                    reconciled_records.append({
                        "ref_core": row['ref_core'],
                        "ref_biller": row['ref_biller'],
                        "merchant_pan": row['merchant_pan'],
                        "customer_pan": row['customer_pan'],
                        "merchant_name": row['merchant_name'],
                        "merchant_location": row['merchant_location'],
                        "transaction_date": row['transaction_date'],
                        "transaction_amount": row['transaction_amount'],
                        "description": row['description'],
                        "jenis": row['jenis'],
                        "status": row['status'],
                        "qris_switching": row['qris_switching'],
                        "response_code": row['response_code'],
                        "merchant_criteria": row['merchant_criteria'],
                        "issuer_name": row['issuer_name'],
                        "acq_name": row['acq_name'],
                        "merchant_mdr": row['merchant_mdr'],
                        "is_biller": row['is_biller'],
                        "is_echannel": row['is_echannel'],
                        "is_cbs": row['is_cbs'],
                        "porefn": row['porefn'],
                        "desc_core": row['desc_core'],
                        "rekening_sumber": row['rekening_sumber'],
                        "rekening_nasabah": row['rekening_nasabah'],
                        "potecn": row['potecn'],
                        "pobchn": row['pobchn'],
                        "podtpo": row['podtpo'],
                        "potime": row['potime'],
                        "poprog": row['poprog'],
                        "bic": row['bic'],
                        "created_at": row['created_at'],
                        "updated_at": row['updated_at'],
                        "status_rekon": "UNMATCH"
                    })
                continue

            is_cbs = group['is_cbs'].any()
            is_biller = group['is_biller'].any()
            is_echannel = group['is_echannel'].any()

            status_rekon = "MATCH" if (is_cbs and is_biller and is_echannel) else "UNMATCH"

            primary_row = group[group['is_cbs']].head(1)
            if primary_row.empty:
                primary_row = group[group['is_echannel']].head(1)
            if primary_row.empty:
                primary_row = group.head(1)

            row = primary_row.iloc[0]

            reconciled_records.append({
                "ref_core": row['ref_core'],
                "ref_biller": row['ref_biller'],
                "merchant_pan": row['merchant_pan'],
                "customer_pan": row['customer_pan'],
                "merchant_name": row['merchant_name'],
                "merchant_location": row['merchant_location'],
                "transaction_date": row['transaction_date'],
                "transaction_amount": amount,
                "description": row['description'],
                "jenis": row['jenis'],
                "status": row['status'],
                "qris_switching": row['qris_switching'],
                "response_code": row['response_code'],
                "merchant_criteria": row['merchant_criteria'],
                "issuer_name": row['issuer_name'],
                "acq_name": row['acq_name'],
                "merchant_mdr": row['merchant_mdr'],
                "is_biller": bool(is_biller),
                "is_echannel": bool(is_echannel),
                "is_cbs": bool(is_cbs),
                "porefn": row['porefn'],
                "desc_core": row['desc_core'],
                "rekening_sumber": row['rekening_sumber'],
                "rekening_nasabah": row['rekening_nasabah'],
                "potecn": row['potecn'],
                "pobchn": row['pobchn'],
                "podtpo": row['podtpo'],
                "potime": row['potime'],
                "poprog": row['poprog'],
                "bic": row['bic'],
                "created_at": row['created_at'],
                "updated_at": row['updated_at'],
                "status_rekon": status_rekon
            })

        with ReconSession() as session:
            session.execute(text("DELETE FROM rekon.rekon_qris_onus"))
            session.commit()
            if reconciled_records:
                session.execute(
                    text("""
                        INSERT INTO rekon.rekon_qris_onus 
                        (ref_core, ref_biller, merchant_pan, customer_pan, merchant_name, merchant_location, transaction_date, transaction_amount, description, jenis, status, qris_switching, response_code, merchant_criteria, issuer_name, acq_name, merchant_mdr, is_biller, is_echannel, is_cbs, porefn, desc_core, rekening_sumber, rekening_nasabah, potecn, pobchn, podtpo, potime, poprog, bic, created_at, updated_at, status_rekon)
                        VALUES (:ref_core, :ref_biller, :merchant_pan, :customer_pan, :merchant_name, :merchant_location, :transaction_date, :transaction_amount, :description, :jenis, :status, :qris_switching, :response_code, :merchant_criteria, :issuer_name, :acq_name, :merchant_mdr, :is_biller, :is_echannel, :is_cbs, :porefn, :desc_core, :rekening_sumber, :rekening_nasabah, :potecn, :pobchn, :podtpo, :potime, :poprog, :bic, :created_at, :updated_at, :status_rekon)
                    """),
                    reconciled_records
                )
                session.commit()

        logger.info(f"[Recon] Reconciled {len(reconciled_records)} transactions for ONUS.")
        return {"status": "success", "processed_rows": len(reconciled_records)}

    except Exception as exc:
        logger.error(f"[Recon] Task failed for ONUS: {exc}")
        raise self.retry(exc=exc)
