import requests
import time

BASE_URL = "http://localhost"

def test_login_ratelimit():
    print("--- Testing login-ratelimit middleware ---")
    url = f"{BASE_URL}/api/auth/login"
    
    ratelimited = False
    print("Mengirimkan banyak request secara cepat ke endpoint login...")
    for i in range(25):
        try:
            response = requests.post(url, json={"username":"test", "password":"password"}, timeout=2)
            if response.status_code == 429:
                print(f"[{i+1}/25] BERHASIL: Rate limit aktif! Permintaan diblokir (Status 429)")
                ratelimited = True
                break
            else:
                print(f"[{i+1}/25] Lolos (Status {response.status_code})")
        except Exception as e:
            print(f"Error koneksi: {e}")
            break
            
    if not ratelimited:
        print("GAGAL: Tidak terkena blokir rate limit setelah 25 permintaan.")

def test_prom_strip():
    print("\n--- Testing prom-strip middleware (Prometheus) ---")
    url = f"{BASE_URL}/monitoring/prometheus/api/v1/status/buildinfo"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("BERHASIL: prom-strip berfungsi! Berhasil mencapai API Prometheus (Status 200)")
        elif response.status_code == 404:
            print("GAGAL: Menerima 404 Not Found. Prefix kemungkinan tidak dihapus.")
        else:
            print(f"Peringatan: Menerima status {response.status_code}")
    except Exception as e:
        print(f"Error koneksi: {e}")

def test_redpanda_strip():
    print("\n--- Testing redpanda-strip middleware (Redpanda Console) ---")
    url = f"{BASE_URL}/monitoring/redpanda/"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("BERHASIL: redpanda-strip berfungsi! Berhasil mencapai Redpanda Console (Status 200)")
        elif response.status_code == 404:
            print("GAGAL: Menerima 404 Not Found. Prefix kemungkinan tidak dihapus.")
        else:
            print(f"Peringatan: Menerima status {response.status_code}")
    except Exception as e:
        print(f"Error koneksi: {e}")

if __name__ == "__main__":
    print("Memulai Pengujian Middleware Traefik...\n")
    test_login_ratelimit()
    time.sleep(1)
    test_prom_strip()
    test_redpanda_strip()
    print("\nPengujian selesai.")
