# Security Hardening Plan

## Top-Level Overview

**Goal:** Memperbaiki 11 temuan vulnerability hasil security audit pada Enterprise Dashboard, diurutkan berdasarkan tingkat risiko. Semua perbaikan bersifat **minimal dan surgical** — tidak mengubah arsitektur atau logika bisnis, hanya menutup celah keamanan yang teridentifikasi.

**Scope:**
- Semua 4 backend service: IAM, Engine, Analytics, Recon
- Frontend: `ent-dash-fe`
- Tidak menyentuh: test files, docker-compose, infrastruktur, fitur bisnis

**Urutan pengerjaan:** P0 → P1 → P2 → P3, satu sub-task per batch perubahan

**Non-goals:**
- Tidak mengganti algoritma JWT dari HS256 ke RS256 (perubahan arsitektur besar)
- Tidak menambahkan antivirus scanning (membutuhkan dependency eksternal)
- Tidak menambahkan 2FA/MFA
- Tidak mengubah skema database

---

## Sub-Tasks

### Sub-Task 1 — [P0] Hapus Default Credentials dan Perbaiki DEBUG Default

**Status:** `[x] done`

**Intent:**
Menghilangkan risiko sistem berjalan dengan credential default (`"password"`) jika operator lupa mengisi `.env`. Ini temuan H-1 yang paling kritis — jika terlewat, seluruh database dan MinIO dapat diakses.

**Expected Outcomes:**
- Semua field credential sensitif di config tidak memiliki default value
- `DEBUG` default ke `False` di semua service
- Service akan **gagal start** dengan pesan jelas jika credential tidak di-set (bukan diam-diam pakai "password")
- `.env.example` diperbarui untuk mencerminkan field yang wajib diisi

**Todo List:**
1. Edit `ent-dash-iam/app/core/config.py`:
   - Hapus default `POSTGRES_PASSWORD: str = "password"` → `POSTGRES_PASSWORD: str` (wajib)
   - Ubah `DEBUG: bool = True` → `DEBUG: bool = False`
2. Edit `ent-dash-engine/app/core/config.py`:
   - Hapus default `POSTGRES_PASSWORD: str = "password"` → wajib
   - Hapus default `MINIO_SECRET_KEY: str = "password"` → wajib
   - Hapus default `MINIO_ACCESS_KEY: str = "admin"` → wajib
   - Ubah `DEBUG: bool = True` → `DEBUG: bool = False`
3. Edit `ent-dash-analytics/app/core/config.py`:
   - Ubah `DEBUG: bool = True` → `DEBUG: bool = False` (jika ada)
   - Hapus default password jika ada
4. Edit `ent-dash-recon/app/core/config.py`:
   - Ubah `DEBUG: bool = True` → `DEBUG: bool = False` (jika ada)
   - Hapus default password jika ada

**Relevant Context:**
- `ent-dash-iam/app/core/config.py` — `Settings(BaseSettings)` class, line 7-15
- `ent-dash-engine/app/core/config.py` — line 8, 13, 35-36
- `ent-dash-analytics/app/core/config.py` — perlu dibaca dulu
- `ent-dash-recon/app/core/config.py` — perlu dibaca dulu
- Pydantic-settings: field tanpa default value akan otomatis raise `ValidationError` saat startup jika env var tidak ada — ini perilaku yang diinginkan

---

### Sub-Task 2 — [P0] Pisahkan Cookie Secure Flag dari DEBUG + Fix int(user_id)

**Status:** `[x] done`

**Intent:**
Dua fix kecil yang independent tapi sama-sama P0:
1. Cookie `refresh_token` harus selalu aman — flag `secure` tidak boleh bergantung pada `DEBUG`
2. `int(user_id)` di IAM deps tanpa try-except dapat menghasilkan HTTP 500 alih-alih 401 jika token di-forge

**Expected Outcomes:**
- Cookie refresh_token menggunakan `COOKIE_SECURE` env var yang terpisah dari `DEBUG`
- `int(user_id)` di-wrap dengan try-except yang melempar `credentials_exception`
- Tidak ada perubahan perilaku fungsional untuk user normal

**Todo List:**
1. Edit `ent-dash-iam/app/core/config.py`:
   - Tambah field baru: `COOKIE_SECURE: bool = True`
2. Edit `ent-dash-iam/app/api/routes/auth.py`:
   - Di fungsi `login` (line 56): ganti `secure=not settings.DEBUG` → `secure=settings.COOKIE_SECURE`
   - Di fungsi `refresh_token` (line 88): sama
   - Di fungsi `logout` (line 108): sama
3. Edit `ent-dash-iam/app/api/deps.py`:
   - Di `get_current_user` (line 40): wrap `int(user_id)` dengan try-except ValueError
   - Di `get_current_user_from_refresh_token` (line 104): sama
4. Update `.env.example`: tambahkan `COOKIE_SECURE=true` dengan komentar penjelasan

**Relevant Context:**
- `ent-dash-iam/app/api/routes/auth.py` — `set_cookie()` dipanggil 3 kali (login, refresh, logout)
- `ent-dash-iam/app/api/deps.py` — `int(user_id)` muncul di line 40 dan 104
- Pattern try-except yang benar: tangkap `ValueError, TypeError` dan re-raise `credentials_exception`

---

### Sub-Task 3 — [P1] Tambahkan MIME Validation + Size Limit pada File Upload

**Status:** `[x] done`

**Intent:**
Saat ini Engine service mempercayai `content_type` header dari client dan tidak membatasi ukuran file sebelum membacanya ke memory. Perbaikan ini menambahkan server-side MIME detection dan size guard.

**Expected Outcomes:**
- File yang bukan CSV/Excel ditolak dengan HTTP 415
- File melebihi 50MB ditolak dengan HTTP 413 sebelum dibaca ke memory
- Deteksi MIME berdasarkan isi file (magic bytes), bukan header client
- Test yang sudah ada untuk imports security tetap lulus

**Todo List:**
1. Tambah dependency `python-magic` ke `ent-dash-engine/requirements.txt`
2. Edit `ent-dash-engine/app/services/imports.py` method `process_upload`:
   - Tambahkan konstanta `MAX_FILE_SIZE = 50 * 1024 * 1024` (50MB)
   - Baca file dengan batas: cek ukuran sebelum memproses lebih lanjut
   - Deteksi MIME dari magic bytes menggunakan `python-magic`
   - Tolak jika MIME tidak ada di whitelist: `{"text/csv", "text/plain", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}`
   - Raise `ValueError` dengan pesan yang sesuai jika validasi gagal
3. Edit `ent-dash-engine/app/api/routes/imports.py` (route handler):
   - Tangkap `ValueError` dari service dan kembalikan HTTP 415 atau 413 yang sesuai

**Relevant Context:**
- `ent-dash-engine/app/services/imports.py` — `process_upload()` method, line 52-116
- `ent-dash-engine/app/api/routes/imports.py` — route handler yang memanggil service
- `ent-dash-engine/tests/api/test_imports_security.py` — test yang sudah ada, harus tetap lulus
- Library: `python-magic` (wraps libmagic) — deteksi MIME dari bytes

---

### Sub-Task 4 — [P1] Tambahkan Date Filter dan LIMIT pada Recon Celery Tasks

**Status:** `[x] done`

**Intent:**
Ketiga Celery task rekonsiliasi (`reconcile_qris_aj`, `reconcile_qris_rintis`, `reconcile_qris_onus`) saat ini melakukan `SELECT *` tanpa filter — jika tabel berisi jutaan baris, worker akan OOM. Perbaikan ini menambahkan filter tanggal dan batas row.

**Expected Outcomes:**
- Setiap task hanya memproses data dalam window waktu yang dikonfigurasi (default: 7 hari terakhir)
- Jumlah baris dibatasi maksimum 500.000 per run
- Jika jumlah baris melebihi limit, task log warning tapi tetap lanjut dengan data yang ada
- Test rekonsiliasi yang sudah ada tetap lulus

**Todo List:**
1. Edit `ent-dash-recon/app/core/config.py`:
   - Tambah: `RECON_LOOKBACK_DAYS: int = 7` — window rekonsiliasi default
   - Tambah: `RECON_MAX_ROWS: int = 500000` — batas baris per run
2. Edit `ent-dash-recon/app/tasks/reconciliation.py`:
   - Di `reconcile_qris_aj` (line 30): ubah query dengan filter `WHERE transaction_date >= :since LIMIT :max_rows`
   - Di `reconcile_qris_rintis` (line 138): sama
   - Di `reconcile_qris_onus` (line 309): sama
   - Hitung `since = date.today() - timedelta(days=settings.RECON_LOOKBACK_DAYS)`
   - Tambah log warning jika `len(df) == settings.RECON_MAX_ROWS`

**Relevant Context:**
- `ent-dash-recon/app/tasks/reconciliation.py` — tiga fungsi task, masing-masing dengan `pd.read_sql()`
- `ent-dash-recon/app/core/config.py` — perlu dibaca dulu untuk melihat pola yang ada
- `ent-dash-recon/tests/test_reconciliation.py` — test yang ada menggunakan data dummy kecil, tidak terpengaruh

---

### Sub-Task 5 — [P1] Ganti SSE Token dari Query Param ke Short-Lived Ticket

**Status:** `[x] done`

**Intent:**
Endpoint SSE `/api/engine/notifications` menerima JWT production via query parameter, yang menyebabkan token masuk ke server logs dan browser history. Solusinya adalah endpoint di IAM yang mengissue "SSE ticket" (token pendek, single-use, TTL 60 detik) khusus untuk SSE.

**Expected Outcomes:**
- JWT utama tidak pernah muncul di URL query string
- Frontend meminta SSE ticket dulu, lalu gunakan ticket tersebut untuk koneksi SSE
- Ticket expired setelah 60 detik atau setelah digunakan
- Endpoint SSE tetap berjalan secara fungsional

**Todo List:**
1. Edit `ent-dash-iam/app/core/security.py`:
   - Tambah fungsi `create_sse_ticket(user_id)` yang menghasilkan JWT dengan `type="sse"` dan `exp=60 detik`
2. Tambah endpoint baru di IAM `ent-dash-iam/app/api/routes/auth.py` (atau route baru):
   - `POST /api/auth/sse-ticket` — autentikasi via Bearer token normal, kembalikan SSE ticket
3. Edit `ent-dash-engine/app/api/deps.py`:
   - Di `get_current_user_from_query`: ubah validasi untuk menerima `type="sse"` bukan `type="access"`
4. Edit `ent-dash-fe/hooks/useNotifications.ts`:
   - Sebelum membuka EventSource, minta SSE ticket dulu via `POST /api/auth/sse-ticket`
   - Gunakan ticket (bukan access token) sebagai query parameter

**Relevant Context:**
- `ent-dash-engine/app/api/deps.py` — `get_current_user_from_query()` line 25-35
- `ent-dash-engine/app/api/routes/notifications.py` — route SSE yang menggunakan dep tersebut
- `ent-dash-fe/hooks/useNotifications.ts` — hook yang membuka EventSource
- `ent-dash-iam/app/core/security.py` — `create_access_token()` sebagai template
- `ent-dash-iam/app/api/main.py` — untuk menambahkan router baru jika perlu

---

### Sub-Task 6 — [P2] Perbaiki CORS Headers dan Redact Email di Audit Log

**Status:** `[x] done`

**Intent:**
Dua fix medium yang independen dan mudah:
1. Ganti `allow_headers=["*"]` dan `expose_headers=["*"]` ke whitelist eksplisit di semua service
2. Redact email dari audit log LOGIN_FAILED untuk mencegah email enumeration

**Expected Outcomes:**
- CORS hanya mengizinkan header yang memang diperlukan
- Audit log LOGIN_FAILED tidak mencatat email asli
- Tidak ada perubahan fungsional untuk user normal

**Todo List:**
1. Edit semua `app/main.py` yang menggunakan `CORSMiddleware`:
   - `ent-dash-iam/app/main.py`
   - `ent-dash-engine/app/main.py`
   - `ent-dash-analytics/app/main.py`
   - `ent-dash-recon/app/main.py`
   - Ganti `allow_headers=["*"]` → `allow_headers=["Content-Type", "Authorization", "Accept"]`
   - Ganti `expose_headers=["*"]` → `expose_headers=["Content-Type"]` (atau hapus jika tidak ada)
2. Edit `ent-dash-iam/app/api/routes/auth.py` line 41:
   - Ganti `request.email` → `"[redacted]"` pada panggilan `AuditService.log_action` untuk LOGIN_FAILED

**Relevant Context:**
- `ent-dash-iam/app/main.py` — `CORSMiddleware` setup
- `ent-dash-engine/app/main.py` — `CORSMiddleware` setup
- `ent-dash-analytics/app/main.py` — perlu dicek apakah ada CORS setup
- `ent-dash-recon/app/main.py` — perlu dicek
- `ent-dash-iam/app/api/routes/auth.py:41` — panggilan `AuditService.log_action` dengan email

---

### Sub-Task 7 — [P3] Fix Versi httpx dan Dokumentasi Security Audit

**Status:** `[x] done`

**Intent:**
Dua item backlog terakhir:
1. Samakan versi `httpx` di Engine ke `>=0.27.0` agar konsisten dengan service lain
2. Simpan laporan security audit sebagai `docs/SECURITY-AUDIT.md` untuk referensi tim

**Expected Outcomes:**
- `httpx` konsisten di semua requirements.txt
- File `docs/SECURITY-AUDIT.md` berisi ringkasan semua temuan, status fix, dan panduan untuk audit berikutnya

**Todo List:**
1. Edit `ent-dash-engine/requirements.txt`:
   - Ubah `httpx==0.26.0` → `httpx>=0.27.0`
2. Buat file `docs/SECURITY-AUDIT.md`:
   - Ringkasan 11 temuan dengan status (fixed/open)
   - Tanggal audit
   - Rekomendasi untuk audit berikutnya (pip-audit, bandit, npm audit)
   - Instruksi cara menjalankan automated security checks

**Relevant Context:**
- `ent-dash-engine/requirements.txt` — line httpx
- `docs/ARCHITECTURE.md` — sebagai referensi gaya penulisan dokumentasi

---

## Catatan Implementasi

- Setiap sub-task harus dijalankan satu per satu dan di-review sebelum lanjut ke berikutnya
- Setelah setiap sub-task, jalankan `./init.sh` untuk memverifikasi tidak ada test yang rusak
- Sub-Task 5 (SSE ticket) adalah yang paling kompleks karena melibatkan 3 service sekaligus — perlu extra review
- Sub-Task 3 membutuhkan `python-magic` yang bergantung pada `libmagic` system library — perlu memastikan ini tersedia di Dockerfile Engine
