import pandas as pd
from unittest.mock import MagicMock, patch
from app.tasks.reconciliation import reconcile_qris_aj, reconcile_qris_rintis, reconcile_qris_onus


def test_reconcile_qris_aj_success():
    raw_data = [
        # Match group 1 (Clean ID: tx001)
        {"id_row": "cbs_tx001", "transaction_date": "2026-06-22 10:00:00", "report_datetime": "2026-06-22 10:00:00", "transaction_amount": 100000.0, "interchange_fee": 100.0, "convenience_fee": 0.0, "merchant_mdr": 0.007, "is_cbs": True, "is_biller": False, "is_ebiller": False},
        {"id_row": "biller_tx001", "transaction_date": "2026-06-22 10:01:00", "report_datetime": "2026-06-22 10:01:00", "transaction_amount": 100000.0, "interchange_fee": 100.0, "convenience_fee": 0.0, "merchant_mdr": 0.007, "is_cbs": False, "is_biller": True, "is_ebiller": False},
        {"id_row": "ebiller_tx001", "transaction_date": "2026-06-22 10:00:00", "report_datetime": "2026-06-22 10:00:00", "transaction_amount": 100000.0, "interchange_fee": 100.0, "convenience_fee": 0.0, "merchant_mdr": 0.007, "is_cbs": False, "is_biller": False, "is_ebiller": True},
        
        # Unmatch group 2 (Clean ID: tx002) - missing ebiller
        {"id_row": "cbs_tx002", "transaction_date": "2026-06-22 11:00:00", "report_datetime": "2026-06-22 11:00:00", "transaction_amount": 150000.0, "interchange_fee": 150.0, "convenience_fee": 0.0, "merchant_mdr": 0.007, "is_cbs": True, "is_biller": False, "is_ebiller": False},
        {"id_row": "biller_tx002", "transaction_date": "2026-06-22 11:01:00", "report_datetime": "2026-06-22 11:01:00", "transaction_amount": 150000.0, "interchange_fee": 150.0, "convenience_fee": 0.0, "merchant_mdr": 0.007, "is_cbs": False, "is_biller": True, "is_ebiller": False},
    ]
    df = pd.DataFrame(raw_data)

    mock_engine = MagicMock()
    mock_session = MagicMock()

    captured_inserts = []
    
    def fake_execute(statement, params=None):
        if params:
            captured_inserts.extend(params)
        return MagicMock()

    mock_session.__enter__.return_value = mock_session
    mock_session.execute.side_effect = fake_execute

    with patch("pandas.read_sql", return_value=df), \
         patch("app.tasks.reconciliation._engine_db.connect", return_value=mock_engine), \
         patch("app.tasks.reconciliation.ReconSession", return_value=mock_session):
        res = reconcile_qris_aj()

    assert res["status"] == "success"
    assert len(captured_inserts) == 2
    
    tx001 = [x for x in captured_inserts if "tx001" in x["id_row"]][0]
    assert tx001["status_rekon"] == "MATCH"
    assert tx001["is_cbs"] is True
    assert tx001["is_biller"] is True
    assert tx001["is_ebiller"] is True

    tx002 = [x for x in captured_inserts if "tx002" in x["id_row"]][0]
    assert tx002["status_rekon"] == "UNMATCH"
    assert tx002["is_cbs"] is True
    assert tx002["is_biller"] is True
    assert tx002["is_ebiller"] is False


def test_reconcile_qris_rintis_success():
    raw_data = [
        # Match Group 1 (ref: rtx001)
        {"id": 1, "ref_core": "cbs_rtx001", "ref_biller": "biller_rtx001", "invoice_number": "inv_rtx001", "merchant_pan": "11", "customer_pan": "22", "merchant_name": "M1", "merchant_location": "L1", "transaction_date": "2026-06-22 12:00:00", "transaction_amount": 200000.0, "description": "", "jenis": "", "auth_resp": "", "trace_no": "trace_rtx001", "status": "", "qris_switching": "", "response_code": "", "interchange_fee": "", "convenience_fee": "", "institution": "", "merchant_criteria": "", "trx_code": "", "issuer_name": "", "acq_name": "", "merchant_mdr": "", "is_cbs": True, "is_biller": False, "is_echannel": False, "porefn": "", "desc_core": "", "rekening_sumber": "", "rekening_nasabah": "", "potecn": 0, "pobchn": 0, "podtpo": 0, "potime": 0, "poprog": "", "bic": "", "report_date": None},
        {"id": 2, "ref_core": "cbs_rtx001", "ref_biller": "biller_rtx001", "invoice_number": "inv_rtx001", "merchant_pan": "11", "customer_pan": "22", "merchant_name": "M1", "merchant_location": "L1", "transaction_date": "2026-06-22 12:00:00", "transaction_amount": 200000.0, "description": "", "jenis": "", "auth_resp": "", "trace_no": "trace_rtx001", "status": "", "qris_switching": "", "response_code": "", "interchange_fee": "", "convenience_fee": "", "institution": "", "merchant_criteria": "", "trx_code": "", "issuer_name": "", "acq_name": "", "merchant_mdr": "", "is_cbs": False, "is_biller": True, "is_echannel": False, "porefn": "", "desc_core": "", "rekening_sumber": "", "rekening_nasabah": "", "potecn": 0, "pobchn": 0, "podtpo": 0, "potime": 0, "poprog": "", "bic": "", "report_date": None},
        {"id": 3, "ref_core": "cbs_rtx001", "ref_biller": "biller_rtx001", "invoice_number": "inv_rtx001", "merchant_pan": "11", "customer_pan": "22", "merchant_name": "M1", "merchant_location": "L1", "transaction_date": "2026-06-22 12:00:00", "transaction_amount": 200000.0, "description": "", "jenis": "", "auth_resp": "", "trace_no": "trace_rtx001", "status": "", "qris_switching": "", "response_code": "", "interchange_fee": "", "convenience_fee": "", "institution": "", "merchant_criteria": "", "trx_code": "", "issuer_name": "", "acq_name": "", "merchant_mdr": "", "is_cbs": False, "is_biller": False, "is_echannel": True, "porefn": "", "desc_core": "", "rekening_sumber": "", "rekening_nasabah": "", "potecn": 0, "pobchn": 0, "podtpo": 0, "potime": 0, "poprog": "", "bic": "", "report_date": None},
    ]
    df = pd.DataFrame(raw_data)

    mock_engine = MagicMock()
    mock_session = MagicMock()

    captured_inserts = []
    
    def fake_execute(statement, params=None):
        if params:
            captured_inserts.extend(params)
        return MagicMock()

    mock_session.__enter__.return_value = mock_session
    mock_session.execute.side_effect = fake_execute

    with patch("pandas.read_sql", return_value=df), \
         patch("app.tasks.reconciliation._engine_db.connect", return_value=mock_engine), \
         patch("app.tasks.reconciliation.ReconSession", return_value=mock_session):
        res = reconcile_qris_rintis()

    assert res["status"] == "success"
    assert len(captured_inserts) == 1
    
    rtx001 = captured_inserts[0]
    assert rtx001["status_rekon"] == "MATCH"
    assert rtx001["is_cbs"] is True
    assert rtx001["is_biller"] is True
    assert rtx001["is_echannel"] is True


def test_reconcile_qris_onus_success():
    raw_data = [
        # Match Group 1 (ref: onus001)
        {"id": 1, "ref_core": "onus001", "ref_biller": "onus001", "merchant_pan": "11", "customer_pan": "22", "merchant_name": "M1", "merchant_location": "L1", "transaction_date": "2026-06-22 14:00:00", "transaction_amount": 50000.0, "description": "", "jenis": "", "status": "", "qris_switching": "", "response_code": "", "merchant_criteria": "", "issuer_name": "", "acq_name": "", "merchant_mdr": "", "is_biller": False, "is_echannel": False, "is_cbs": True, "porefn": "p_onus001", "desc_core": "", "rekening_sumber": "", "rekening_nasabah": "", "potecn": 0, "pobchn": 0, "podtpo": 0, "potime": 0, "poprog": "", "bic": "", "created_at": None, "updated_at": None},
        {"id": 2, "ref_core": "onus001", "ref_biller": "onus001", "merchant_pan": "11", "customer_pan": "22", "merchant_name": "M1", "merchant_location": "L1", "transaction_date": "2026-06-22 14:00:00", "transaction_amount": 50000.0, "description": "", "jenis": "", "status": "", "qris_switching": "", "response_code": "", "merchant_criteria": "", "issuer_name": "", "acq_name": "", "merchant_mdr": "", "is_biller": True, "is_echannel": False, "is_cbs": False, "porefn": "p_onus001", "desc_core": "", "rekening_sumber": "", "rekening_nasabah": "", "potecn": 0, "pobchn": 0, "podtpo": 0, "potime": 0, "poprog": "", "bic": "", "created_at": None, "updated_at": None},
        {"id": 3, "ref_core": "onus001", "ref_biller": "onus001", "merchant_pan": "11", "customer_pan": "22", "merchant_name": "M1", "merchant_location": "L1", "transaction_date": "2026-06-22 14:00:00", "transaction_amount": 50000.0, "description": "", "jenis": "", "status": "", "qris_switching": "", "response_code": "", "merchant_criteria": "", "issuer_name": "", "acq_name": "", "merchant_mdr": "", "is_biller": False, "is_echannel": True, "is_cbs": False, "porefn": "p_onus001", "desc_core": "", "rekening_sumber": "", "rekening_nasabah": "", "potecn": 0, "pobchn": 0, "podtpo": 0, "potime": 0, "poprog": "", "bic": "", "created_at": None, "updated_at": None},
    ]
    df = pd.DataFrame(raw_data)

    mock_engine = MagicMock()
    mock_session = MagicMock()

    captured_inserts = []
    
    def fake_execute(statement, params=None):
        if params:
            captured_inserts.extend(params)
        return MagicMock()

    mock_session.__enter__.return_value = mock_session
    mock_session.execute.side_effect = fake_execute

    with patch("pandas.read_sql", return_value=df), \
         patch("app.tasks.reconciliation._engine_db.connect", return_value=mock_engine), \
         patch("app.tasks.reconciliation.ReconSession", return_value=mock_session):
        res = reconcile_qris_onus()

    assert res["status"] == "success"
    assert len(captured_inserts) == 1
    
    onus001 = captured_inserts[0]
    assert onus001["status_rekon"] == "MATCH"
    assert onus001["is_cbs"] is True
    assert onus001["is_biller"] is True
    assert onus001["is_echannel"] is True
