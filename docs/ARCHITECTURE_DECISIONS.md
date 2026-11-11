# Architecture Decision Records (ADR)

Dokumen ini mencatat keputusan-keputusan arsitektural krusial (Architecture Decision Records) yang mendasari pembangunan platform **Integrated School & Pesantren Management SaaS**.

---

## ADR 001: Pemilihan Pola Arsitektur Modular Monolith dibanding Microservices

* **Status:** Diterima (Accepted)
* **Konteks:** Platform ditujukan untuk mengelola sekolah umum, madrasah, dan pondok pesantren dengan kapasitas 1.000–3.000 santri per institusi secara multi-tenant. Diperlukan kecepatan pengembangan tinggi, transaksi data konsisten (terutama finansial dan kehadiran), serta kemudahan operasional di tahap awal.
* **Keputusan:** Mengadopsi arsitektur **Modular Monolith** menggunakan NestJS. Setiap domain bisnis (Auth, Master Data, Attendance, Finance, Academic, Pesantren) diisolasi dalam modul-modul mandiri dengan batasan domain yang ketat (*bounded contexts*).
* **Konsekuensi:**
  * *Positif:* Tidak ada kompleksitas *distributed transactions* (2PC/Saga), latency jaringan antar-service nol, proses deployment sederhana ke single VPS/container, dan refactoring mudah.
  * *Mitigasi Masa Depan:* Isolasi domain yang ketat memungkinkan ekstraksi modul tertentu menjadi microservice independen di masa mendatang jika beban komputasi melonjak.

---

## ADR 002: Model Multi-Tenancy — Shared Database dengan PostgreSQL Row-Level Security (RLS)

* **Status:** Diterima (Accepted)
* **Konteks:** Menampung ribuan institusi pendidikan dengan biaya infrastruktur yang efisien namun menjamin pemisahan data 100% aman dan tidak terjadi kebocoran lintas tenant.
* **Keputusan:** Menggunakan model **Shared Database, Shared Schema** dengan penegakan keamanan berlapis (*defense-in-depth*):
  1. *Layer 1 (Database):* PostgreSQL Row-Level Security (RLS) dengan session parameter `app.current_tenant_id`.
  2. *Layer 2 (Backend Application):* NestJS TenantGuard, Interceptor, dan Prisma Middleware/Client extensions yang memvalidasi `tenant_id` pada setiap query.
* **Konsekuensi:**
  * *Positif:* Penggunaan memori dan koneksi database efisien, migrasi skema tunggal untuk seluruh tenant, dan biaya hosting hemat.
  * *Mitigasi:* Untuk tenant skala korporasi/enterprise besar di masa depan, sistem menyediakan abstraction layer untuk routing ke database khusus (*dedicated database*).

---

## ADR 003: Strategi Offline-First Mobile Menggunakan SQLite & Drift ORM

* **Status:** Diterima (Accepted)
* **Konteks:** Sekolah dan pesantren sering berada di area dengan sinyal seluler atau Wi-Fi yang tidak stabil (gerbang asrama, lapangan olahraga, aula). Petugas presensi dan ustaz harus tetap dapat memindai presensi dan mencatat setoran hafalan Al-Qur'an (tahfiz) tanpa koneksi internet.
* **Keputusan:** Membangun aplikasi Flutter dengan kapabilitas **Offline-First** menggunakan database lokal SQLite yang dikelola melalui **Drift ORM**. Aksi yang dilakukan offline disimpan dalam *write-ahead operation queue* beralamat UUID dan disinkronkan secara otomatis dengan algoritma *exponential backoff* saat online.
* **Konsekuensi:**
  * *Positif:* Aplikasi tidak pernah mengalami hambatan (*freeze*) saat offline; presensi lapangan berjalan instan (< 100ms).
  * *Mitigasi:* Transaksi keuangan **dilarang ditimpa secara otomatis**; jika ada anomali pembayaran offline, status ditandai `NEEDS_RECONCILIATION` untuk ditinjau oleh Bendahara.

---

## ADR 004: Pemilihan Prisma ORM untuk Backend NestJS

* **Status:** Diterima (Accepted)
* **Konteks:** Diperlukan ORM dengan *type-safety* end-to-end, migrasi skema deklaratif yang teruji, dan performa tinggi pada PostgreSQL 16.
* **Keputusan:** Menggunakan **Prisma ORM** v5.22+.
* **Konsekuensi:**
  * *Positif:* Skema database tunggal (`schema.prisma`) sebagai *source of truth*, auto-generated TypeScript types, query type-safe, dan tool migrasi terotomatisasi (`prisma migrate`).

---

## ADR 005: Strategi Autentikasi dengan Short-Lived Access Token & Refresh Token Rotation (RTR)

* **Status:** Diterima (Accepted)
* **Konteks:** Aplikasi diakses oleh ribuan siswa, wali murid, guru, dan admin dari mobile dan web. Diperlukan autentikasi yang aman terhadap pembajakan sesi.
* **Keputusan:** Mengimplementasikan **JWT Access Token jangka pendek (15 menit)** dikombinasikan dengan **Refresh Token Rotation (RTR)** berdurasi 7 hari. Refresh token disimpan terenkripsi di database dan sesi aktif dicatat di Redis. Setiap kali refresh token digunakan, token lama langsung dihanguskan dan token baru diterbitkan.
* **Konsekuensi:**
  * *Positif:* Jika refresh token lama dicoba pakai kembali (indikasi token dicuri), seluruh token family sesi tersebut langsung dicabut (*breach detection*).

---

## ADR 006: Background Task Processing dengan Redis & BullMQ

* **Status:** Diterima (Accepted)
* **Konteks:** Operasi berat seperti generate PDF Rapor massal, pengiriman notifikasi push Firebase/WhatsApp ke ribuan wali santri, dan penagihan SPP bulanan tidak boleh menghambat (*block*) respons HTTP REST API.
* **Keputusan:** Memisahkan beban kerja asinkron ke dalam queue sistem berbasis **Redis dan BullMQ**.
* **Konsekuensi:**
  * *Positif:* Waktu respons API tetap di bawah 200ms; proses berat dijalankan oleh worker di latar belakang dengan mekanisme retry otomatis.

---

## ADR 007: Penggunaan Monorepo dengan npm Workspaces

* **Status:** Diterima (Accepted)
* **Konteks:** Proyek memiliki beberapa platform (API, Web, Mobile) yang berbagi tipe data TypeScript, DTO kontrak API, dan aturan bisnis.
* **Keputusan:** Menggunakan struktur **Monorepo** dengan `npm workspaces` tanpa memerlukan tooling monorepo yang over-engineered pada fase awal.
* **Konsekuensi:**
  * *Positif:* Satu repositori Git, kemudahan refactoring lintas modul, CI/CD terpusat, dan dependensi types otomatis sinkron.
