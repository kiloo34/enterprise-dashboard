import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import get_current_user_payload
from app.db.session import get_db

async def override_get_db():
    yield None

async def override_get_current_user_payload():
    return {"sub": "1", "role": "admin"}

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user_payload] = override_get_current_user_payload

client = TestClient(app)

def test_upload_invalid_mime_type():
    file_content = b"MZ\x90\x00\x03\x00\x00\x00"
    files = {"file": ("malware.exe", file_content, "application/x-msdownload")}
    data = {"target_table": "rekon.rekon_qris_aj"}
    
    response = client.post("/api/imports/upload", files=files, data=data)
    
    assert response.status_code == 400
    assert response.json()["code"] == "INVALID_FILE_TYPE"

def test_upload_oversized_file():
    # Generate a payload slightly larger than the 50MB limit
    file_content = b"0" * (50 * 1024 * 1024 + 10)
    files = {"file": ("large.csv", file_content, "text/csv")}
    data = {"target_table": "rekon.rekon_qris_aj"}
    
    response = client.post("/api/imports/upload", files=files, data=data)
    
    assert response.status_code == 400
    assert response.json()["code"] == "FILE_TOO_LARGE"
