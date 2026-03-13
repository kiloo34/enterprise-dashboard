# Panduan Menjalankan Sistem (Tanpa Docker / Lokal)

Dokumen ini menjelaskan langkah-langkah untuk menjalankan Enterprise Dashboard secara langsung di sistem operasi Anda tanpa menggunakan Docker.

## Prasyarat
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Redis**

## 1. Persiapan Database
1. Pastikan PostgreSQL berjalan.
2. Buat database baru bernama `ent-dash`.
3. Sesuaikan file `.env` di direktori `ent-dash-backend` jika user/password database Anda berbeda dari default:
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=pekalongan12
   POSTGRES_SERVER=127.0.0.1
   POSTGRES_PORT=5432
   POSTGRES_DB=ent-dash
   ```

## 2. Inisialisasi Backend (FastAPI)
Buka terminal baru di direktori `ent-dash-backend`:
```bash
# Buat Virtual Environment
python -m venv venv

# Aktifkan Venv (Mac/Linux)
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Jalankan Inisialisasi Data (Seed)
python -m app.db.seed

# Jalankan Server
uvicorn app.main:app --reload --port 8000
```
Backend akan berjalan di [http://localhost:8000](http://localhost:8000).

## 3. Inisialisasi Frontend (Next.js)
Buka terminal baru di direktori `ent-dash-fe`:
```bash
# Install Dependencies
npm install

# Sesuaikan .env.local jika diperlukan
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Jalankan Development Server
npm run dev
```
Frontend akan berjalan di [http://localhost:3000](http://localhost:3000).

## 4. Inisialisasi Worker (Opsional - untuk Background Job)
Jika Anda membutuhkan fitur asinkron, jalankan Celery di terminal terpisah (di folder backend):
```bash
source venv/bin/activate
celery -A app.worker.celery_app worker --loglevel=info
```

---
**PENTING**: Pastikan Redis sudah berjalan di sistem Anda sebelum menjalankan Celery. Konfigurasi default mengharapkan Redis di `127.0.0.1:6379`.
