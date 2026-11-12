# EduSaaS — Integrated School & Pesantren Management System

> **Platform SaaS Manajemen Terpadu Sekolah Formal & Pondok Pesantren Berbasis Multi-Tenant dengan Keamanan PostgreSQL Row-Level Security (RLS), Offline-First Mobile Sync, dan Kepatuhan Perlindungan Data Pribadi (UU PDP).**

[![CI Pipeline](https://github.com/angga2103/ManejemenSekolah/actions/workflows/ci.yml/badge.svg)](https://github.com/angga2103/ManejemenSekolah/actions)
[![Build Android APK](https://github.com/angga2103/ManejemenSekolah/actions/workflows/build-android-apk.yml/badge.svg)](https://github.com/angga2103/ManejemenSekolah/actions/workflows/build-android-apk.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![Flutter Version](https://img.shields.io/badge/Flutter-3.47.5-blue.svg)](https://flutter.dev/)
[![Database](https://img.shields.io/badge/PostgreSQL-16%20RLS-336791.svg)](https://www.postgresql.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](#lisensi)

---

## ⚡ 1-COMMAND INSTALLER (VPS 1GB RAM READY)

Aplikasi ini telah dilengkapi skrip installer otomatis **1-Klik** yang dirancang khusus untuk kemudahan instalasi di Virtual Private Server (VPS), bahkan pada **VPS berdaya rendah (RAM 1 GB / 1 vCPU)** tanpa khawatir crash atau kehabisan memori (*Out Of Memory / OOM*).

### Cara Install di VPS (Ubuntu 20.04 / 22.04 / 24.04 LTS / Debian 11 / 12)

Cukup login ke terminal VPS Anda sebagai `root` dan jalankan **satu perintah** berikut:

```bash
curl -fsSL https://raw.githubusercontent.com/angga2103/ManejemenSekolah/develop/install.sh | sudo bash
```

*Atau jika repository sudah di-clone ke VPS:*
```bash
sudo bash install.sh
```

### Apa yang Dilakukan Installer Otomatis Ini?
1. 🛡️ **Auto-Swap 2GB Provisioning:** Mendeteksi RAM server. Jika RAM ≤ 1GB, installer otomatis membuat dan mengaktifkan file Swap 2GB (`/swapfile`) dengan tuning kernel `swappiness=15` agar proses kompilasi dan database berjalan mulus tanpa OOM Killer.
2. 📦 **Otomatis Install Seluruh Software Utama:** Menginstal Node.js 20 LTS, PostgreSQL 16, Redis Server, Nginx Web Server, dan PM2 Process Manager secara native (jauh lebih hemat memori dibanding Docker pada VPS 1GB).
3. ⚙️ **Tuning Memori Rendah:** Mengonfigurasi PostgreSQL (`shared_buffers=128MB`) dan Redis (`maxmemory 64mb`) agar hemat RAM.
4. 🔐 **Inisialisasi Database & Row Level Security (RLS):**
   - Membuat database `edusaas_prod` dan role runtime `edusaas_app_user` (hak akses non-superuser, no-truncate, least-privilege).
   - Menjalankan migrasi skema database Prisma.
   - Menerapkan proteksi isolasi data RLS pada **53 tabel skema**.
5. 🚀 **Kompilasi & Peluncuran Layanan:**
   - Membangun paket monorepo (API NestJS dan Web Portal React Vite).
   - Menjalankan Backend API via PM2 dengan batas alokasi memori hemat (`--max-old-space-size=350`).
   - Mengonfigurasi Nginx Reverse Proxy (Port 80) yang menyajikan Web Portal dan meneruskan panggilan `/api/` ke backend.
6. 📋 **Ringkasan Kredensial:** Otomatis menghasilkan file `.env` dengan secret terenkripsi dan menyimpan catatan akses di `/var/www/edusaas/INSTALL_CREDENTIALS.txt`.

---

## 📱 BUILD & DOWNLOAD APK ANDROID VIA GITHUB ACTIONS

Source code mobile Flutter (`apps/mobile`) bersifat cross-platform (mendukung **Android & iOS**). Untuk memudahkan pengembangan tanpa perlu setup Android Studio atau SDK berukuran giga-byte di laptop/komputer Anda, **aplikasi Android dapat dikompilasi langsung di Cloud melalui GitHub Actions**.

### Cara Download File APK Hasil Build:
1. Buka halaman GitHub Repository: [https://github.com/angga2103/ManejemenSekolah](https://github.com/angga2103/ManejemenSekolah)
2. Klik tab **Actions** di menu atas.
3. Di panel sebelah kiri, pilih workflow **"Build Android APK (Release & Debug)"**.
4. Klik tombol **Run workflow** di sebelah kanan:
   - Pilih Branch: `develop`
   - Pilih Tipe Build: `release` (siap install di HP) atau `debug`
   - Klik tombol hijau **Run workflow**.
5. Tunggu ~2–3 menit hingga status bertanda centang hijau (**Success**).
6. Klik pada baris workflow yang selesai tersebut, scroll ke bagian paling bawah ke tabel **Artifacts**.
7. Klik dan unduh **`edusaas-mobile-android-apk`** (berupa file zip yang berisi file `.apk` siap langsung dipasang di HP Android santri, guru, atau wali santri).

> **Catatan untuk iOS:** Source code Flutter sudah siap untuk platform iOS. Kompilasi build iOS (`.ipa`) dapat dijalankan di komputer Mac (macOS dengan Xcode) atau melalui runner macOS GitHub Actions saat rilis ke Apple App Store.

---

## 🏛️ FITUR UTAMA & ARSITEKTUR SISTEM

EduSaaS memadukan kebutuhan operasional sekolah formal nasional (Kemendikbudristek/Kemenag) dan kehidupan pesantren modern dalam satu ekosistem:

### 1. Multi-Tenant Row Level Security (RLS)
- Isolasi data tingkat kernel basis data pada 53 model database (41 tabel langsung bertipe tenant, 10 tabel anak dengan correlated subquery, 1 tabel root tenant, dan 1 tabel master RBAC).
- Pemisahan peran database: `edusaas_app_user` berjalan dengan hak DML granular (`SELECT, INSERT, UPDATE, DELETE`) tanpa izin `TRUNCATE` atau DDL, sehingga kebal terhadap eskalasi hak akses (*privilege escalation*) dan manipulasi GUC `app.is_super_admin`.

### 2. Kurikulum Ganda (Dual Curriculum)
- Manajemen kurikulum formal nasional terintegrasi dengan kepesantrenan (Diniyah, Tahfiz Qur'an, Halaqah, Mutaba'ah Yaumiyah, dan Perizinan Santri).
- Buku induk santri, mutasi kelas, dan pencatatan pelanggaran/prestasi santri.

### 3. Presensi Offline-First & Keamanan QR
- Mobile attendance scanner berbasis SQLite (Drift) yang tetap dapat melakukan absensi saat internet mati di lapangan.
- Validasi tanda tangan kriptografi token QR presensi dan anti-titip absen (*anti-proxy*).

### 4. Keuangan Sekolah & Pembayaran Digital
- Pembuatan tagihan SPP/biaya santri otomatis, penerbitan kuitansi, dan rekonsiliasi pembayaran.
- Webhook payment gateway yang diperkeras dengan verifikasi signature **timing-safe** (`crypto.timingSafeEqual`), anti-replay protection, dan proteksi idempotensi.

### 5. Perlindungan Privasi Data Pribadi (UU PDP)
- Masking otomatis NIK (Nomor Induk Kependudukan) wali santri pada endpoint publik/list untuk mencegah kebocoran data sensitif kependudukan.

---

## 📂 STRUKTUR MONOREPO

```
├── .github/
│   └── workflows/
│       ├── build-android-apk.yml  # Build APK Android otomatis di cloud
│       ├── ci.yml                 # Monorepo CI verification pipeline
│       └── mobile-ci.yml          # Flutter test & analyze pipeline
├── apps/
│   ├── api/                       # NestJS modular monolith backend REST API
│   ├── web/                       # React + TypeScript + Vite portal administrasi
│   └── mobile/                    # Flutter cross-platform mobile app (Android & iOS)
├── packages/
│   ├── shared-types/              # Definisi interface TypeScript & DTO bersama
│   └── api-contracts/             # Kontrak API & validator payload
├── infrastructure/
│   ├── docker/                    # Dockerfile API & Web
│   ├── postgres/
│   │   └── init-rls.sql           # DDL PostgreSQL Row-Level Security 53 tabel
│   └── docker-compose.yml         # Konfigurasi container development
├── install.sh                     # ⚡ 1-Click Installer untuk VPS (1GB RAM Ready)
├── package.json                   # Konfigurasi workspace monorepo npm
└── README.md
```

---

## 🛠️ PANDUAN PENGEMBANGAN LOKAL (LOCAL DEV)

Jika Anda ingin menjalankan atau mengembangkan kode di komputer lokal:

### Prasyarat
- Node.js `>= 20.0.0` dan npm `>= 10.0.0`
- Flutter SDK `>= 3.47.0` (khusus pengembangan mobile)

### Langkah Menjalankan:
```bash
# 1. Clone repository
git clone -b develop https://github.com/angga2103/ManejemenSekolah.git
cd ManejemenSekolah

# 2. Install dependensi monorepo
npm install

# 3. Jalankan pengujian backend Jest (152 passed / 152 tests)
npm run test --workspace=apps/api

# 4. Jalankan pengujian mobile Flutter
cd apps/mobile
flutter analyze
flutter test

# 5. Build seluruh workspace monorepo
npm run build --workspaces
```

---

## 📜 LISENSI
Hak Cipta Terpelihara & Proprietary. Seluruh kode sumber dilindungi hak cipta.
