"""
Tests for rec-001: Recon Matching Engine API

Verifies:
1. Status endpoint returns correct dictionary.
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_recon_status_endpoint():
    """Status endpoint must return expected format."""
    response = client.get("/api/recon/status")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "Recon Service"
    assert data["status"] == "active"
    assert data["models_loaded"] is True
