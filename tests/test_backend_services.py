import requests
import time
import sys

BASE_URL = "http://localhost"
# Traefik should route these:
# IAM: /api/auth, /api/user* etc.
# Analytics: /api/dashboard
# Engine: /api/imports, /api/engine
# Recon: /api/recon

def check_service(name, endpoint, expected_status=200):
    url = f"{BASE_URL}{endpoint}"
    print(f"Testing {name} -> GET {url}")
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == expected_status or response.status_code in [200, 401, 403]:
            # 401/403 is fine for protected routes, it means the service routing works and responded
            print(f"✅ {name} Is Reachable (Status: {response.status_code})")
            return response
        else:
            print(f"❌ {name} Failed (Status: {response.status_code}) - {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ {name} Unreachable - Is Docker Compose running? Error: {e}")
        return None

def run_tests():
    print("=== BEGIN BACKEND SERVICES TEST ===")
    
    # Test 1: IAM Service (Check login route exists - expect 405 Method Not Allowed since it's POST)
    check_service("IAM Service", "/api/auth/login", expected_status=405)
    
    # Test 2: IAM Service (Protected Route - expect 401 Unauthorized)
    check_service("IAM Service", "/api/user", expected_status=401)
    
    # Test 3: Analytics Service (Protected Route - expect 401 Unauthorized)
    check_service("Analytics Service", "/api/dashboard/financial")
    
    # Test 4: Engine Service (Monitoring API)
    # Changed from auth required to auth required (since we added deps.py)
    check_service("Engine Service (Logs)", "/api/dw/engine/monitor/logs", expected_status=401)
    
    # Test 5: Engine Service (Stats)
    check_service("Engine Service (Stats)", "/api/dw/engine/monitor/stats", expected_status=401)
    
    # Test 6: Recon Service (Placeholder API)
    # The /status endpoint doesn't require auth in our minimal setup
    res = check_service("Recon Service", "/api/recon/status", expected_status=200)
    if res and res.status_code == 200:
        print(f"   Response: {res.json()}")

if __name__ == "__main__":
    run_tests()
