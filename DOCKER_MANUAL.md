# Panduan Menjalankan Sistem (Docker)

Dokumen ini menjelaskan langkah-langkah untuk menjalankan Enterprise Dashboard menggunakan Docker.

## Prasyarat
- Docker Desktop terinstal.
- Docker Compose terinstal.

## Langkah-langkah Menjalankan

### 1. Build dan Jalankan Container
Jalankan perintah berikut di direktori utama proyek:
```bash
docker compose up --build -d
```
Perintah ini akan membangun image untuk backend dan frontend, kemudian menjalankan layanan Database (PostgreSQL), Redis, Backend (FastAPI), Celery, dan Frontend (Next.js) di latar belakang.

### 2. Inisialisasi Database & Seed Data
Setelah container berjalan, Anda perlu menginisialisasi skema database dan mengisi data awal (role, permission, user):
```bash
# Inisialisasi Skema
docker exec -it ent_dash_backend python -m app.db.init_schema

# Isi Data Awal (Seed)
docker exec -it ent_dash_backend python -m app.db.seed
```

### 3. Akses Aplikasi
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

## Perintah Penting Lainnya

### Melihat Log
```bash
docker compose logs -f
```

### Menghentikan Container
```bash
docker compose down
```

### Menghapus Volume Database (Reset Total)
```bash
docker compose down -v
```

---
**Catatan Keamanan**: Konfigurasi database di Docker menggunakan port `5434` secara eksternal (untuk akses dari luar container) dan `5432` secara internal. 
