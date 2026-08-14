# Plan: Refactor ke Service Baru `ent-dash-dw`

## Top-Level Overview

Tujuan: Buat microservice baru `ent-dash-dw` yang menjadi satu-satunya pemilik database
`CBSKONV` dengan tiga schema — `rekon`, `DATAWARE`, dan `TABLEAU_REPORT` — lalu migrasikan
semua model tabel `engine_*` dari `ent-dash-engine` ke service baru ini. Engine diputus
sepenuhnya dari tabel-tabel tersebut dan hanya menjadi Kafka producer.

**Database terdampak:**
- `CBSKONV` (baru) — milik `ent-dash-dw`
- `ent_dash_engine` (sudah ada) — model & route engine monitoring dihapus
- `ent_dash_recon` (sudah ada) — tidak berubah (tabel rekon_qris_* tetap di sini)

**Yang TIDAK diubah:** logika import file, Celery tasks, MinIO, IAM, Analytics, Recon QRIS.

---

## Sub-Tasks

### ST-1 — Buat Database `CBSKONV` di Container PostgreSQL

**Intent:** Provision database baru `CBSKONV` di container `ent_dash_db` yang sudah berjalan,
dan tambahkan ke init script agar recreate otomatis saat volume baru.

**Expected Outcomes:**
- Database `CBSKONV` ada di container PostgreSQL.
- `docker-compose.yml` env var `POSTGRES_MULTIPLE_DATABASES` sudah menyertakan `CBSKONV`.

**Todo List:**
1. Tambahkan `CBSKONV` ke env var `POSTGRES_MULTIPLE_DATABASES` di `docker-compose.yml` service `db`.
2. Jalankan `CREATE DATABASE CBSKONV;` langsung di container yang berjalan via `docker exec` psql
   (karena init script hanya jalan saat volume pertama kali dibuat).
3. Verifikasi: `\l` di psql menampilkan database `CBSKONV`.

**Relevant Context:**
- `postgres-init/init-multiple-databases.sh` — script init, baca dulu untuk memahami pattern.
- `docker-compose.yml` service `db`, key `POSTGRES_MULTIPLE_DATABASES`.

**Status:** `[x] done — CBSKONV provisioned, docker-compose.yml updated`

---

### ST-2 — Scaffold Service `ent-dash-dw`

**Intent:** Buat skeleton service baru mengikuti persis pola `ent-dash-recon` sebagai referensi
(Dockerfile, requirements.txt, struktur direktori app/).

**Expected Outcomes:**
- Direktori `ent-dash-dw/` ada dengan struktur lengkap yang identik polanya dengan `ent-dash-recon`.
- Service bisa di-build: `docker compose build dw` sukses.

**Todo List:**
1. Buat file-file berikut (salin & adaptasi dari `ent-dash-recon`):
   - `ent-dash-dw/Dockerfile` — identik, tidak ada perubahan
   - `ent-dash-dw/.dockerignore` — identik
   - `ent-dash-dw/requirements.txt` — identik (hapus `confluent-kafka` karena DW hanya consume)
   - `ent-dash-dw/app/__init__.py`
   - `ent-dash-dw/app/db/base.py` — `declarative_base()`
   - `ent-dash-dw/app/db/__init__.py`
   - `ent-dash-dw/app/core/__init__.py`
   - `ent-dash-dw/app/api/__init__.py`
   - `ent-dash-dw/app/models/__init__.py`
   - `ent-dash-dw/app/schemas/__init__.py`
   - `ent-dash-dw/app/services/__init__.py`
   - `ent-dash-dw/app/api/routes/__init__.py`
2. Buat `ent-dash-dw/app/core/config.py`:
   - `API_V1_STR = "/api/dw"`
   - `POSTGRES_DB = "CBSKONV"`
   - Properti `sqlalchemy_database_uri` — identik polanya
   - Properti `sync_database_uri` (psycopg2)
   - `SECRET_KEY`, `ALGORITHM`, `CELERY_BROKER_URL` (tetap ada untuk Kafka consumer)
3. Buat `ent-dash-dw/app/db/session.py` — gunakan `make_session_factory` + `make_get_db` dari `ent_dash_common.db` (3 baris, sama persis pola recon).
4. Buat `ent-dash-dw/app/api/deps.py` — gunakan `make_jwt_dependency` dari `ent_dash_common.auth` (sama persis pola recon).
5. Buat `ent-dash-dw/app/api/main.py` — `APIRouter()` kosong dulu, akan diisi di ST-4.
6. Buat `ent-dash-dw/app/main.py` — FastAPI app dengan lifespan (panggil `init_db`, Kafka consumer placeholder), CORS identik pola recon, Prometheus instrumentator.

**Relevant Context:**
- `ent-dash-recon/Dockerfile` — template
- `ent-dash-recon/app/core/config.py` — template
- `ent-dash-recon/app/db/session.py` — 3-line pattern
- `ent-dash-recon/app/api/deps.py` — template
- `ent-dash-common/ent_dash_common/db.py` — `make_session_factory`, `make_get_db`
- `ent-dash-common/ent_dash_common/auth.py` — `make_jwt_dependency`

**Status:** `[x] done — skeleton ent-dash-dw/ dibuat, python3 -m compileall bersih`

---

### ST-3 — Pindahkan Model `engine_*` ke `ent-dash-dw`

**Intent:** Buat ulang semua 9 SQLAlchemy model dari `ent-dash-engine/app/models/engine.py`
di `ent-dash-dw`, lalu buat `init_db.py` yang membuat 3 schema (`rekon`, `DATAWARE`,
`TABLEAU_REPORT`) dan semua tabel secara idempoten saat startup.

**Expected Outcomes:**
- `ent-dash-dw/app/models/engine.py` ada dengan semua 9 model, schema masih `rekon`.
- `ent-dash-dw/app/db/init_db.py` membuat schema `rekon`, `DATAWARE`, `TABLEAU_REPORT`
  dan create_all tabel idempoten.
- Alembic dikonfigurasi untuk database `CBSKONV`.

**Todo List:**
1. Buat `ent-dash-dw/app/models/engine.py` — salin seluruh 9 class dari
   `ent-dash-engine/app/models/engine.py` tanpa modifikasi kolom.
2. Buat `ent-dash-dw/app/db/init_db.py`:
   - `CREATE SCHEMA IF NOT EXISTS rekon`
   - `CREATE SCHEMA IF NOT EXISTS "DATAWARE"`
   - `CREATE SCHEMA IF NOT EXISTS "TABLEAU_REPORT"`
   - `Base.metadata.create_all` untuk register semua model.
3. Setup Alembic:
   - `ent-dash-dw/alembic.ini` — salin dari `ent-dash-recon/alembic.ini`
   - `ent-dash-dw/alembic/env.py` — adaptasi: target `ent-dash-dw` models + config
   - `ent-dash-dw/alembic/script.py.mako` — identik
   - `ent-dash-dw/alembic/README` — identik
   - Buat initial migration `alembic revision --autogenerate` di dalam container setelah ST-6.
4. Panggil `init_db()` dari `lifespan` di `main.py` (sudah ada placeholder dari ST-2).
5. Verifikasi syntax: `python -m compileall ent-dash-dw/app/` sukses.

**Relevant Context:**
- `ent-dash-engine/app/models/engine.py` — source 9 model
- `ent-dash-recon/alembic/` — template alembic struktur
- `ent-dash-recon/app/db/init_schema.py` — pola `CREATE SCHEMA IF NOT EXISTS`
- Nama schema `DATAWARE` dan `TABLEAU_REPORT` menggunakan huruf besar — perlu quoted
  identifier di PostgreSQL: `"DATAWARE"`, `"TABLEAU_REPORT"`.

**Status:** `[x] done — models/engine.py (9 model), models/__init__.py, db/init_db.py (3 schema + create_all), alembic scaffolded; python3 -m compileall bersih`

---

### ST-4 — Pindahkan Route Engine Monitoring ke `ent-dash-dw`

**Intent:** Pindahkan endpoint `/api/engine/monitor/logs`, `/api/engine/monitor/stats`, dan
`/api/engine/dynamic-data` dari `ent-dash-engine` ke `ent-dash-dw` di path `/api/dw/engine/...`.
Service `ent-dash-dw` menjadi satu-satunya yang melayani query ke tabel `engine_*`.

**Expected Outcomes:**
- `ent-dash-dw/app/api/routes/engine.py` ada dengan semua 3 endpoint monitor.
- `ent-dash-dw/app/services/engine_monitoring.py` ada — OOP class `EngineMonitoringService`
  (bukan loose functions).
- Traefik rule di `docker-compose.yml` untuk `dw` service mencakup path `/api/dw`.

**Todo List:**
1. Buat `ent-dash-dw/app/services/engine_monitoring.py` sebagai class `EngineMonitoringService`
   — enkapsulasi `get_dynamic_engine_data`, `get_engine_logs`, `get_engine_stats` dari
   `ent-dash-engine/app/services/engine_monitoring.py` ke dalam method class.
2. Buat `ent-dash-dw/app/api/routes/engine.py` — identik endpoint-nya, gunakan
   `EngineMonitoringService(db)`.
3. Update `ent-dash-dw/app/api/main.py` — include router dengan prefix `/engine`.
4. Verifikasi syntax semua file baru.

**Relevant Context:**
- `ent-dash-engine/app/services/engine_monitoring.py` — source logic (loose functions,
  harus diubah ke OOP class)
- `ent-dash-engine/app/api/routes/engine.py` — source endpoints
- Code Quality rule: backend business logic WAJIB class-based (lihat AGENTS.md)

**Status:** `[x] done — EngineMonitoringService OOP class created, engine router added to ent-dash-dw, frontend paths updated to /api/dw/engine/..., python3 -m compileall bersih`

---

### ST-5 — Tambah `ent-dash-dw` ke `docker-compose.yml`

**Intent:** Daftarkan service `dw` ke orchestration stack sehingga bisa di-build, di-run,
dan diakses via Traefik pada prefix `/api/dw`.

**Expected Outcomes:**
- Service `dw` tampil di `docker compose ps`.
- `GET /api/dw/status` (atau health) merespons 200.

**Todo List:**
1. Tambahkan service `dw` ke `docker-compose.yml` dengan:
   - `build.context: ./ent-dash-dw`, `additional_contexts: common: ./ent-dash-common`
   - env vars: `POSTGRES_SERVER`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB=CBSKONV`,
     `POSTGRES_PORT`, `SECRET_KEY`, `KAFKA_BOOTSTRAP_SERVERS`
   - `depends_on: db, redis`
   - Traefik labels: `PathPrefix("/api/dw")`, priority 42
2. `docker compose build dw` — harus sukses.
3. `docker compose up -d dw` — container UP.
4. Cek log: `docker logs ent_dash_dw` — tidak ada error, schema terbuat.

**Relevant Context:**
- `docker-compose.yml` service `recon_api` — template untuk env vars dan labels
- Traefik priority: recon=40, analytics=45, iam=50 — gunakan 42 untuk dw

**Status:** `[x] done — service dw ditambahkan ke docker-compose.yml, build sukses, container UP, schema rekon/DATAWARE/TABLEAU_REPORT terbuat, 9 tabel engine_* terbuat di rekon schema, GET /api/dw/status merespons 200 OK`

---

### ST-6 — Hapus Model & Route `engine_*` dari `ent-dash-engine`

**Intent:** Setelah `ent-dash-dw` berjalan dan tabel engine_* ada di `CBSKONV`, bersihkan
`ent-dash-engine` dari semua referensi ke model dan endpoint monitoring tersebut agar tidak
ada duplikasi atau akses ganda ke tabel engine_*.

**Expected Outcomes:**
- `ent-dash-engine/app/models/engine.py` dihapus.
- `ent-dash-engine/app/services/engine_monitoring.py` dihapus.
- `ent-dash-engine/app/api/routes/engine.py` dihapus.
- `ent-dash-engine/app/db/init_db.py` tidak lagi create schema `rekon` atau tabel `engine_*`.
- `ent-dash-engine/app/api/main.py` tidak include router `engine`.
- `docker compose build engine` sukses setelah cleanup.
- `python -m compileall ent-dash-engine/app/` bersih.

**Todo List:**
1. Hapus `ent-dash-engine/app/models/engine.py`.
2. Hapus `ent-dash-engine/app/services/engine_monitoring.py`.
3. Hapus `ent-dash-engine/app/api/routes/engine.py`.
4. Update `ent-dash-engine/app/models/__init__.py` — hapus import `engine.*`.
5. Update `ent-dash-engine/app/db/init_db.py`:
   - Hapus import semua model dari `app.models.engine`.
   - Hapus `CREATE SCHEMA IF NOT EXISTS rekon` (rekon bukan milik engine lagi).
   - Hanya buat schema `app` dan tabel `file_imports`.
6. Update `ent-dash-engine/app/api/main.py` — hapus include_router `engine`.
7. Cek apakah ada route lain yang import dari `engine_monitoring` atau `models.engine` —
   gunakan grep, bersihkan semua.
8. `python -m compileall ent-dash-engine/app/` — harus bersih.
9. `docker compose build engine` — harus sukses.
10. Rebuild dan restart: `docker compose up -d --build engine`.

**Relevant Context:**
- `ent-dash-engine/app/api/main.py` — hapus import engine router
- `ent-dash-engine/app/db/init_db.py` — bersihkan schema/model engine_*
- `ent-dash-engine/app/models/__init__.py` — bersihkan import

**Status:** `[x] done — models/engine.py, services/engine_monitoring.py, api/routes/engine.py, services/data_explorer.py, api/routes/data_explorer.py dihapus; init_db.py hanya buat schema app + tabel file_imports; api/main.py bersih dari engine & data_explorer router; python3 -m compileall bersih; docker compose build & up sukses; uvicorn running normal`

---

### ST-7 — Update `feature_list.json` dan `progress.md`

**Intent:** Catat state akhir ke harness artifacts agar session berikutnya bisa lanjut
tanpa ambiguitas.

**Expected Outcomes:**
- `feature_list.json` punya entry baru `dw-001` dengan status `done`.
- `progress.md` memiliki section baru yang merangkum semua perubahan.

**Todo List:**
1. Tambahkan entry `dw-001` di `feature_list.json` dengan description, dependencies, evidence.
2. Update `progress.md` — tambah section baru dengan ringkasan:
   - Service `ent-dash-dw` dibuat
   - Database `CBSKONV` diprovisioned
   - Model `engine_*` dipindah dari engine ke dw
   - Engine dibersihkan dari referensi engine_*

**Status:** `[x] done — feature_list.json entry dw-001 ditambahkan (status: done), progress.md section ent-dash-dw Refactor ditambahkan di bagian atas`

---

## Urutan Eksekusi

```
ST-1 → ST-2 → ST-3 → ST-4 → ST-5 → ST-6 → ST-7
```

ST-6 (hapus dari engine) HARUS setelah ST-5 (dw UP dan tabel terbuat) untuk menghindari
downtime.

ST-4 juga mencakup update frontend: semua path `/api/engine/monitor/...` dan
`/api/engine/dynamic-data` di frontend dialihkan ke `/api/dw/engine/...`.

## Keputusan Desain yang Dikonfirmasi

- Schema `DATAWARE` dan `TABLEAU_REPORT` menggunakan **UPPER CASE** — gunakan quoted
  identifier di PostgreSQL dan SQLAlchemy: `"DATAWARE"`, `"TABLEAU_REPORT"`.
- Frontend endpoint engine monitoring dialihkan dari `/api/engine/...` ke `/api/dw/engine/...`
  sebagai bagian dari ST-4.
