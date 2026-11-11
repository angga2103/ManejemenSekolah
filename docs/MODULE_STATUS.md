# Matriks Status Modul Bisnis (Module Status Matrix)

Dokumen ini melacak status implementasi setiap modul fungsional sesuai aturan: **"Never claim a feature is complete without implementation and testing evidence."**

---

| No | Modul Sistem | Status | Bukti Implementasi & Pengujian |
| :---: | :--- | :---: | :--- |
| **0** | **Arsitektur & Fondasi Monorepo** | `VERIFIED` | Monorepo npm, NestJS/React/Flutter build sukses, unit test lulus. |
| **1** | **Autentikasi & Multi-Tenant Engine** | `VERIFIED` | Full DB bcrypt authentication, dynamic tenant resolution, granular RBAC (12 roles + 171 permissions), refresh token rotation, audit logging, React auth portal, Flutter auth service; 8/8 test suites lulus (25/25 tests). |
| **2** | **Master Data Lembaga & Santri** | `VERIFIED` | Backend CRUD & search/filter API, relasi santri-wali N:M (multi-anak, hak akses finansial terpisah), rombel kelas & penugasan siswa, dual kurikulum formal & diniyah, batch import & export CSV; Web portal Siswa/Rombel/Wali dengan filter & drawer detail; Flutter model & service; 11/11 test suites lulus (35/35 unit tests). |
| **3** | **Presensi & Offline Synchronization** | `VERIFIED` | Dynamic QR HMAC-SHA256 (anti-screenshot 30s), kalkulasi keterlambatan cutoff, pencegahan duplikat, offline sync batch protocol, alur permohonan izin (izin/sakit/dispensasi) dengan auto-sync presensi, notifikasi multi-channel (In-App, FCM Push, WhatsApp), web dashboard proyektor & antrean izin, mobile offline queue & scanner screen; 14/14 test suites lulus (46/46 unit tests). |
| **4** | **Manajemen Finansial & Pembayaran** | `NOT_STARTED` | Skema tabel tagihan/pembayaran siap; integrasi payment gateway belum dibuat. |
| **5** | **Akademik & Dual Kurikulum** | `NOT_STARTED` | Skema mata pelajaran & nilai siap; kalkulasi nilai & ekspor PDF belum dibuat. |
| **6** | **LMS & Ujian Daring (CBT)** | `NOT_STARTED` | Belum diimplementasikan. |
| **7** | **Kepesantrenan, Asrama & Tahfiz** | `NOT_STARTED` | Skema asrama & tahfiz siap; alur bisnis belum diimplementasikan. |
| **8** | **Komunikasi & Konseling (BK)** | `NOT_STARTED` | Belum diimplementasikan. |
| **9** | **SaaS Developer Control Center** | `NOT_STARTED` | Wireframe prototipe React siap; API belum terhubung. |
| **10**| **Audit Keamanan & Deployment Live** | `NOT_STARTED` | Docker Compose & backup script siap; deployment produksi belum dieksekusi. |
