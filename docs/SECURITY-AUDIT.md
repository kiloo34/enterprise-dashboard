# Security Audit — Enterprise Dashboard

> Dokumen ini merekam hasil audit keamanan yang dilakukan terhadap seluruh codebase Enterprise Dashboard. Diperbarui setiap kali audit dilakukan atau temuan diperbaiki.

---

## Audit: Initial Code Review

**Tanggal:** 2025  
**Metode:** Manual code review (source-based static analysis)  
**Scope:** 4 backend services + frontend (Next.js)  
**Reviewer:** Security scan via agent-assisted analysis

---

## Ringkasan Temuan

| ID | Severity | Kategori | Status |
|---|---|---|---|
| H-1 | 🔴 High | Hardcoded Default Credentials | ✅ Fixed |
| H-2 | 🔴 High | JWT di URL Query Parameter (SSE) | ✅ Fixed |
| M-1 | 🟡 Medium | Cookie Secure Flag bergantung DEBUG | ✅ Fixed |
| M-2 | 🟡 Medium | SELECT * tanpa LIMIT di Recon tasks | ✅ Fixed |
| M-3 | 🟡 Medium | CORS allow_headers/expose_headers=["*"] | ✅ Fixed |
| M-4 | 🟡 Medium | Upload file tanpa validasi MIME server-side | ✅ Fixed |
| M-5 | 🟡 Medium | int(user_id) tanpa try-except di IAM deps | ✅ Fixed |
| M-6 | 🟡 Medium | Email tercatat di audit log LOGIN_FAILED | ✅ Fixed |
| L-1 | 🔵 Low | window.__getAuthToken terekspos global | ⚠️ Accepted Risk |
| L-2 | 🔵 Low | MinIO tanpa TLS (MINIO_USE_SSL=False) | ⚠️ Accepted Risk (dev only) |
| L-3 | 🔵 Low | Versi httpx tidak konsisten antar service | ✅ Fixed |

---

## Detail Perbaikan

### H-1 — Hardcoded Default Credentials ✅ Fixed

**File yang diubah:**
- `ent-dash-iam/app/core/config.py`
- `ent-dash-engine/app/core/config.py`
- `ent-dash-analytics/app/core/config.py`
- `ent-dash-recon/app/core/config.py`

**Perubahan:** Semua field credential sensitif (`POSTGRES_PASSWORD`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`) dihapus default value-nya. Pydantic-settings akan melempar `ValidationError` saat startup jika env var tidak ada. `DEBUG` default diubah ke `False` di semua service.

---

### H-2 — JWT di URL Query Parameter (SSE) ✅ Fixed

**File yang diubah:**
- `ent-dash-iam/app/core/security.py` — tambah `create_sse_ticket()`
- `ent-dash-iam/app/api/routes/auth.py` — tambah `POST /api/auth/sse-ticket`
- `ent-dash-engine/app/api/deps.py` — validasi `type="sse"` bukan `type="access"`
- `ent-dash-fe/hooks/useNotifications.ts` — request ticket dulu sebelum buka EventSource

**Perubahan:** Endpoint SSE `/api/engine/notifications` sekarang hanya menerima SSE ticket (TTL 60 detik, `type="sse"`), bukan main access token. Frontend meminta ticket via `POST /api/auth/sse-ticket` sebelum membuka koneksi SSE.

---

### M-1 — Cookie Secure Flag ✅ Fixed

**File yang diubah:**
- `ent-dash-iam/app/core/config.py` — tambah `COOKIE_SECURE: bool = True`
- `ent-dash-iam/app/api/routes/auth.py` — ganti `secure=not settings.DEBUG` → `secure=settings.COOKIE_SECURE`
- `.env.example` — tambah `COOKIE_SECURE=false` (dengan komentar: hanya untuk local dev)

---

### M-2 — SELECT * tanpa LIMIT di Recon Tasks ✅ Fixed

**File yang diubah:**
- `ent-dash-recon/app/core/config.py` — tambah `RECON_LOOKBACK_DAYS: int = 7` dan `RECON_MAX_ROWS: int = 500000`
- `ent-dash-recon/app/tasks/reconciliation.py` — ketiga task sekarang memfilter `WHERE transaction_date >= :since LIMIT :max_rows`

---

### M-3 — CORS Headers Wildcard ✅ Fixed

**File yang diubah:** semua `*/app/main.py`

**Perubahan:** `allow_headers=["*"]` → `allow_headers=["Content-Type", "Authorization", "Accept"]` dan `expose_headers=["*"]` → `expose_headers=["Content-Type"]`

---

### M-4 — Upload File tanpa MIME Validation ✅ Fixed

**File yang diubah:**
- `ent-dash-engine/Dockerfile` — tambah `libmagic1` system package
- `ent-dash-engine/requirements.txt` — tambah `python-magic>=0.4.27`, upgrade `httpx>=0.27.0`
- `ent-dash-engine/app/services/imports.py` — deteksi MIME dari magic bytes, size guard sebelum `file.read()`
- `ent-dash-engine/app/api/routes/imports.py` — hapus duplikasi validasi di route, tangkap `ValueError` dari service

---

### M-5 — int(user_id) tanpa Try-Except ✅ Fixed

**File yang diubah:** `ent-dash-iam/app/api/deps.py`

**Perubahan:** Dua kemunculan `int(user_id)` di-wrap dengan `try/except (ValueError, TypeError)` yang melempar `credentials_exception` (HTTP 401), bukan HTTP 500.

---

### M-6 — Email Enumeration via Audit Log ✅ Fixed

**File yang diubah:** `ent-dash-iam/app/api/routes/auth.py`

**Perubahan:** `AuditService.log_action(..., request.email, ...)` pada LOGIN_FAILED diubah ke `"[redacted]"`.

---

### L-1 — window.__getAuthToken Global ⚠️ Accepted Risk

**File:** `ent-dash-fe/components/AuthContext.tsx`

**Keputusan:** Diterima sebagai risiko rendah karena CSP header sudah dikonfigurasi (`default-src 'self'`) yang mencegah XSS injection eksternal. Token disimpan di `useRef` (bukan localStorage), yang sudah merupakan mitigasi utama. Refactor ke closure private dapat dilakukan jika ada kekhawatiran spesifik di masa mendatang.

---

### L-2 — MinIO tanpa TLS ⚠️ Accepted Risk (Development)

**File:** `ent-dash-engine/app/core/config.py`

**Keputusan:** `MINIO_USE_SSL=False` acceptable untuk lingkungan Docker internal (semua traffic dalam jaringan container yang sama). Untuk deployment production ke cloud/remote MinIO, operator harus set `MINIO_USE_SSL=true` via env var.

---

### L-3 — Versi httpx Tidak Konsisten ✅ Fixed

**File:** `ent-dash-engine/requirements.txt`

**Perubahan:** `httpx==0.26.0` → `httpx>=0.27.0`

---

## Panduan Audit Berikutnya

### Automated Dependency Scanning

Jalankan secara rutin (disarankan: setiap sprint atau sebelum release):

```bash
# Python dependency audit — semua service
pip install pip-audit
pip-audit -r ent-dash-iam/requirements.txt
pip-audit -r ent-dash-engine/requirements.txt
pip-audit -r ent-dash-analytics/requirements.txt
pip-audit -r ent-dash-recon/requirements.txt

# JavaScript dependency audit
cd ent-dash-fe && npm audit

# Static code analysis (Python)
pip install bandit
bandit -r ent-dash-iam/app ent-dash-engine/app ent-dash-analytics/app ent-dash-recon/app -f txt
```

### Checklist Manual Review (per sprint)

- [ ] Tidak ada credential baru yang di-hardcode di source code
- [ ] Semua endpoint baru memiliki autentikasi JWT
- [ ] Query database baru menggunakan parameterized queries (bukan string concatenation)
- [ ] File upload baru divalidasi MIME type
- [ ] Tidak ada token/secret yang di-log
- [ ] Audit log tidak mencatat data sensitif (password, token, nomor rekening penuh)

### Escalation

Jika ditemukan vulnerability severity High atau Critical baru:
1. Jangan commit ke branch main — buat branch `security/fix-<nama>` terpisah
2. Fix harus di-review sebelum merge
3. Update tabel temuan di dokumen ini
