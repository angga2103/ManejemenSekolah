# Audit Lingkungan Pengembangan & Infrastruktur (Environment Audit)

**Tanggal Audit:** 11 November 2026  
**Status Proyek:** Phase 0 — Foundation & Infrastructure Preparation  
**Auditor:** Senior Software Architect / DevOps Engineer  

---

## 1. Lingkungan Pengembangan Lokal (Local Environment)

| Komponen | Status / Versi | Catatan |
| :--- | :--- | :--- |
| **Sistem Operasi** | Windows 10 Pro (x64) Build 19045 | Shell: PowerShell |
| **Node.js** | v24.11.0 | Kompatibel dengan LTS `>=20.0.0` |
| **npm** | 11.6.1 | Mendukung npm workspaces |
| **Flutter SDK** | 3.47.5 (Channel Stable) | Framework revision 6a19cca564 |
| **Dart SDK** | 3.13.4 | Mendukung Dart 3 pattern matching & primary constructors |
| **Git CLI** | 2.55.0.windows.3 | Menggunakan Windows Credential Manager |
| **Docker Engine** | Docker Desktop terpasang (WSL2) | Layanan daemon saat ini dalam keadaan stopped |
| **GitHub CLI (`gh`)**| Belum terpasang di sistem | Autentikasi git menggunakan HTTPS credential helper |

---

## 2. Status Repositori & Konfigurasi Git

* **Status Direktori Kerja**: `c:\aplikasi baru`
* **Branch Utama**: `main`
* **Remote Origin**: `https://github.com/angga2103/ManejemenSekolah.git`
* **Konektivitas Remote**: Terverifikasi (`git ls-remote origin` berhasil merespons; repositori GitHub terdeteksi masih kosong dan siap menerima initial commit).
* **Git User Identity**:
  * Name: `vermilii`
  * Email: `mbahgundul615@gmail.com`
* **Branching Strategy Target**:
  * `main` (Production release branch)
  * `develop` (Integration branch)
  * `feature/*` (Feature development branches)

---

## 3. Informasi Ubuntu VPS (Target Server)

* Berdasarkan Master Specification, target deployment adalah **Ubuntu VPS** yang akan mengorkestrasikan container Docker (API, Web, PostgreSQL, Redis, MinIO/S3, Caddy/Nginx reverse proxy).
* Akses SSH langsung ke VPS dari mesin lokal ini belum dikonfigurasi secara eksplisit (credential SSH tidak boleh disimpan secara hardcode di repositori).
* Alur deployment yang direkomendasikan dan disiapkan adalah melalui **GitHub Actions CI/CD** menggunakan GitHub Repository Secrets (`VPS_HOST`, `VPS_USERNAME`, `VPS_SSH_KEY`). Panduan konfigurasi VPS mandiri telah disediakan di `docs/DEPLOYMENT.md`.

---

## 4. Analisis Kebutuhan Runtime & Dependensi

1. **Backend API (`apps/api`)**:
   * Framework: NestJS v10
   * ORM: Prisma Client v5.22.0
   * Engine: TypeScript 5.7+
   * Database: PostgreSQL 16 (dengan ekstensi `uuid-ossp` dan session context RLS)
   * Queue & Caching: Redis 7 + BullMQ
2. **Web Portal (`apps/web`)**:
   * Framework: React 18 + Vite 6
   * Styling: Tailwind CSS 3
   * Routing: React Router v7
   * State/Data Fetching: TanStack React Query & React Table
3. **Mobile App (`apps/mobile`)**:
   * Framework: Flutter 3.47+
   * Local Persistence: SQLite melalui Drift ORM v2.35
   * Secure Storage: `flutter_secure_storage`
   * Hardware Integration: `mobile_scanner` (QR scanning) & `connectivity_plus`

---

## 5. Tindakan Setup yang Direkomendasikan (Action Items)

1. **Jalankan Docker Desktop**: Untuk menjalankan stack database PostgreSQL, Redis, dan MinIO secara lokal menggunakan perintah `npm run infra:up`.
2. **Sinkronisasi Remote GitHub**: Mendaftarkan branch `main` dan `develop` ke remote repository `https://github.com/angga2103/ManejemenSekolah.git`.
3. **Konfigurasi GitHub Secrets**: Mendaftarkan credential VPS dan token pada GitHub repository settings untuk mendukung pipeline CI/CD deployment otomatis.
