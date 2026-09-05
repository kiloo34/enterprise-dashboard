# Plan: Engine Import Controls + Reconciliation Monitoring Page

## Top-Level Overview

**Goal:** Dua deliverable terpisah dalam satu sesi:

1. **Backend:** Implementasikan 3 endpoint Engine yang saat ini placeholder — `cancel`, `retry`, dan `reset-stuck` — agar benar-benar berinteraksi dengan Celery task queue dan database.
2. **Frontend:** Isi halaman placeholder `/engine/reconciliation` dengan monitoring job rekonsiliasi yang fungsional — menampilkan status trigger, histori job, dan tombol manual trigger per jaringan (AJ, Rintis, ONUS).

**Scope:**
- Backend: `ent-dash-engine/app/api/routes/imports.py` (3 endpoint) + `ent-dash-engine/app/services/imports.py` (logika cancel/retry/reset)
- Frontend: `ent-dash-fe/app/(dashboard)/engine/reconciliation/page.tsx` (halaman baru) + service call ke Recon API
- Tidak menyentuh: Celery task logic, matching algorithm, database schema, service lain

**Non-goals:**
- Tidak membuat WebSocket untuk real-time Celery task status
- Tidak membuat antrian prioritas (FIFO sudah cukup)
- Tidak mengubah algoritma rekonsiliasi

---

## Sub-Tasks

### Sub-Task 1 — Backend: Cancel Import (Benar-benar Revoke Celery Task)

**Status:** `[ ] pending`

**Intent:**
Saat ini `POST /api/imports/{id}/cancel` hanya set status ke `"FAILED"` tanpa mencoba menghentikan Celery task yang sedang berjalan. Implementasi benar harus merevoke task Celery jika masih `pending` atau `processing`, kemudian update DB status ke `"cancelled"`.

**Expected Outcomes:**
- Import dengan status `pending` atau `processing` bisa di-cancel
- Import yang sudah `completed`/`failed`/`cancelled` mengembalikan error yang sesuai
- Celery task di-revoke via `celery_app.control.revoke(task_id, terminate=True)`
- DB status berubah ke `"cancelled"` (bukan `"FAILED"`)
- Test lulus

**Todo List:**
1. Tambah field `celery_task_id` ke model `FileImport` — agar kita bisa merevoke task spesifik
2. Update `CRUDFileImport` untuk menyimpan `celery_task_id` saat task di-queue
3. Update `ImportService` — tambah method `cancel_import(import_id)`: cek status, revoke task, update DB
4. Update route `POST /api/imports/{id}/cancel` — panggil service method, kembalikan 409 jika sudah selesai
5. Update Celery task di `imports.py` — simpan task ID ke DB saat task mulai berjalan

**Relevant Context:**
- `ent-dash-engine/app/models/imports.py` — FileImport model (perlu kolom baru `celery_task_id`)
- `ent-dash-engine/app/services/imports.py` — ImportService (tambah method cancel)
- `ent-dash-engine/app/api/routes/imports.py:88-96` — endpoint cancel saat ini (placeholder)
- `ent-dash-engine/app/worker.py` — `celery_app` instance untuk merevoke
- `ent-dash-engine/app/tasks/imports.py:52` — task `process_csv_import` (simpan task ID via `self.request.id`)
- Pattern: `celery_app.control.revoke(task_id, terminate=True, signal='SIGTERM')`

---

### Sub-Task 2 — Backend: Retry Import (Benar-benar Re-queue ke Celery)

**Status:** `[ ] pending`

**Intent:**
Saat ini `POST /api/imports/{id}/retry` hanya set status ke `"PROCESSING"` tanpa re-queue ke worker. Implementasi benar harus: reset status ke `pending`, kemudian dispatch ulang Celery task `process_csv_import` dengan `import_id` dan `object_name` dari record yang ada.

**Expected Outcomes:**
- Import dengan status `failed` atau `partial` bisa di-retry
- Import yang sedang `processing` atau sudah `completed` mengembalikan error yang sesuai
- Celery task baru di-dispatch dengan `.delay(import_id, object_name, target_table)`
- DB status di-reset ke `"pending"`, `error_log` dikosongkan, `celery_task_id` diperbarui
- Test lulus

**Todo List:**
1. Update `ImportService` — tambah method `retry_import(import_id)`: cek status eligible, reset DB, dispatch task baru
2. Update route `POST /api/imports/{id}/retry` — panggil service method, kembalikan 409 jika tidak eligible
3. Pastikan `minio_object_name` tersimpan dengan benar di DB (untuk dipakai saat retry)

**Relevant Context:**
- `ent-dash-engine/app/services/imports.py` — tambah method `retry_import`
- `ent-dash-engine/app/crud/crud_import.py` — `FileImportUpdate` schema sudah ada
- `ent-dash-engine/app/api/routes/imports.py:98-111` — endpoint retry saat ini (placeholder)
- `ent-dash-engine/app/tasks/imports.py` — `process_csv_import.delay(import_id, object_name, target_table)` adalah cara dispatch

---

### Sub-Task 3 — Backend: Reset Stuck Imports

**Status:** `[ ] pending`

**Intent:**
`POST /api/imports/reset-stuck` saat ini return hardcoded string tanpa melakukan apapun. Import yang stuck di status `processing` terlalu lama (misal >2 jam) perlu di-reset ke `failed` secara otomatis. Ini penting untuk mencegah import yang "ghost" tidak bisa di-retry.

**Expected Outcomes:**
- Query semua `FileImport` dengan status `processing` yang `updated_at` lebih dari `threshold_minutes` menit lalu (default: 120 menit)
- Update status ke `"failed"`, set `error_log` dengan pesan "Reset: timed out after X minutes"
- Kembalikan jumlah record yang di-reset
- Endpoint hanya bisa diakses oleh user dengan JWT valid (sudah ada `get_current_user_payload`)

**Todo List:**
1. Tambah method `reset_stuck_imports(threshold_minutes: int)` ke `ImportService`
2. Query: `SELECT * FROM app.file_imports WHERE status = 'processing' AND updated_at < NOW() - INTERVAL`
3. Bulk update status ke `"failed"` dengan error_log yang menjelaskan alasan reset
4. Update route `POST /api/imports/reset-stuck` — panggil service, return `{"reset_count": N}`
5. Tambah optional query param `threshold_minutes` (default 120) ke endpoint

**Relevant Context:**
- `ent-dash-engine/app/services/imports.py` — tambah method `reset_stuck_imports`
- `ent-dash-engine/app/api/routes/imports.py:113-119` — endpoint saat ini (placeholder)
- SQLAlchemy datetime filter pattern: `FileImport.updated_at < (datetime.utcnow() - timedelta(minutes=threshold))`

---

### Sub-Task 4 — Frontend: Halaman Engine Reconciliation Monitoring

**Status:** `[ ] pending`

**Intent:**
Halaman `/engine/reconciliation` saat ini adalah placeholder kosong. Halaman ini harus menampilkan:
1. Status summary rekonsiliasi 3 jaringan (AJ, Rintis, ONUS) — total transaksi, match/unmatch
2. Tombol manual trigger rekonsiliasi per jaringan
3. Konfirmasi sebelum trigger (untuk mencegah double-trigger)

Halaman ini memanfaatkan endpoint Recon yang sudah ada sepenuhnya (`/api/recon/dashboard/*-stats` dan `POST /api/recon/reconcile/{network}`).

**Expected Outcomes:**
- Halaman menampilkan 3 card status (AJ, Rintis, ONUS) dengan data dari `useReconStats` atau direct API call
- Setiap card memiliki tombol "Trigger Rekonsiliasi" dengan dialog konfirmasi
- Trigger yang berhasil menampilkan toast success dengan task_id
- Loading state selama fetch dan selama trigger
- Tidak ada data statis/hardcoded
- `npm run build` lulus

**Todo List:**
1. Buat atau update `ent-dash-fe/services/ReconService.ts` — tambah fungsi:
   - `getAjStats()`, `getRintisStats()`, `getOnusStats()` (jika belum ada)
   - `triggerReconcile(network: "aj" | "rintis" | "onus")` (jika belum ada)
2. Tulis ulang `ent-dash-fe/app/(dashboard)/engine/reconciliation/page.tsx`:
   - 3 `NetworkReconCard` component (inline atau di folder) dengan props: nama jaringan, stats, onTrigger
   - Setiap card: total transaksi, settled amount, unsettled amount, badge MATCH/UNMATCH %
   - Tombol "Trigger Rekonsiliasi" membuka `AlertDialog` konfirmasi dari shadcn/ui
   - Setelah konfirmasi: panggil service, tampilkan toast, refresh stats
3. Gunakan shadcn/ui `Card`, `Badge`, `Button`, `AlertDialog` — tidak ada raw CSS custom

**Relevant Context:**
- `ent-dash-fe/services/ReconService.ts` — file service yang sudah ada, lihat fungsi apa saja yang ada
- `ent-dash-fe/app/(dashboard)/rekon-engine/page.tsx` — referensi pola yang sudah ada untuk halaman monitoring
- `ent-dash-fe/components/ui/` — shadcn/ui components yang tersedia
- Backend endpoint tersedia: `GET /api/recon/dashboard/aj-stats`, `POST /api/recon/reconcile/aj` (dst)
- Pola toast: gunakan `toast.success()` dari `sonner` (sudah dipakai di tempat lain)

---

## Catatan Implementasi

- Sub-Task 1, 2, 3 bisa dikerjakan paralel karena semua di file yang sama — tapi lebih aman dikerjakan berurutan untuk menghindari merge conflict pada `ImportService`
- Sub-Task 1 memerlukan perubahan DB model (`celery_task_id` kolom baru) — pastikan Alembic migration atau `Base.metadata.create_all` akan menambahkan kolom ini
- Sub-Task 4 sepenuhnya independen dari 1-3 dan bisa dikerjakan kapan saja
- Setelah semua selesai: jalankan `python -m compileall ent-dash-engine/app -q` dan `npm run build`
