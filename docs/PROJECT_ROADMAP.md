# Peta Jalan Pengembangan Proyek (Project Roadmap)

Platform dikembangkan secara bertahap (*incremental milestone strategy*) dengan sistem status tugas yang transparan:
- `NOT_STARTED` : Belum dimulai
- `IN_PROGRESS` : Sedang dalam pengerjaan
- `BLOCKED` : Terkendala dependensi
- `COMPLETED` : Selesai diimplementasikan
- `VERIFIED` : Teruji dengan bukti pengujian lulus (*automated tests pass*)

---

## Rincian Status Per Fase

### [Phase 0] Architecture Foundation, Repository Setup & Infrastructure
* **Status**: `VERIFIED`
* **Bukti**: 4 unit test NestJS lolos, widget test Flutter lolos, static analysis lolos, Prisma schema lolos validasi, build web Vite lolos.
* **Cakupan**: 11 dokumen master arsitektur, monorepo workspaces, konfigurasi Docker Compose, template CI/CD.

### [Phase 1] Authentication, Multi-Tenancy Engine & Granular RBAC
* **Status**: `VERIFIED`
* **Bukti**: 8 unit test suites NestJS lolos (25/25 tests), registrasi & resolusi tenant publik, login real bcrypt hash, refresh token rotation di DB, decorator @Roles & @RequirePermissions, permission catalog 171 aksi, React auth context & login/register pages, Flutter auth API service.
* **Cakupan**: Registrasi tenant, login JWT + Refresh Token Rotation, RLS session injector, decorator `@Roles` & `@RequirePermissions`, seed script 12 sistem roles & demo accounts.

### [Phase 2] Master Data & Student/Institution Management
* **Status**: `VERIFIED`
* **Bukti**: 11 unit test suites NestJS lolos (35/35 tests), API endpoints lengkap (Students, Guardians, Classes, Institutions, Employees, Subjects), N:M relasi wali-santri dengan hak akses finansial & darurat terpisah, export CSV & parser batch import, Web management interface di React dengan drawer detail & modal relasi, Dart models & API service di Flutter lolos analyzer & tests.
* **Cakupan**: Lembaga, rombel kelas, data induk santri, data wali murid, pemetaan relasi santri-wali, import/export Excel.

### [Phase 3] Attendance Engine, Offline Synchronization & Notifications
* **Status**: `VERIFIED`
* **Bukti**: 14 unit test suites NestJS lolos (46/46 tests), engine QR dinamis HMAC-SHA256 dengan time-window validation, offline sync batch protocol dengan pelaporan status terperinci, integrasi permohonan izin dengan auto-sync status presensi, notifikasi otomatis wali murid (In-App, Push FCM, WhatsApp), antarmuka web proyektor kelas & antrean izin, antarmuka mobile scanner & offline queue (0 issues di Flutter analyze, widget test lulus).
* **Cakupan**: Presensi barcode/QR dinamis bertanda tangan kriptografis, Drift SQLite write queue, sinkronisasi otomatis, push notification Firebase/WhatsApp.

### [Phase 4] Financial Management, Billing & Payment Gateway Integration
* **Status**: `VERIFIED`
* **Bukti**: 17 unit test suites NestJS lolos (57/57 tests), generator faktur berkala & idempoten, penanganan cicilan & pelunasan otomatis, isolasi hak akses finansial wali murid, charge simulator QRIS & Virtual Account multibank dengan verifikasi webhook HMAC-SHA256, kuitansi digital anti-fraud, double-entry bookkeeping otomatis berimbang (Debit/Credit), modul web manajemen keuangan lengkap, mobile billing & receipt screen (Flutter analyze 0 issues, test lulus).
* **Cakupan**: Tagihan SPP berkala, uang gedung, infak santri, integrasi sandbox QRIS/VA, struk digital, pencatatan jurnal umum kas.

### [Phase 5] Academic Management, Dual Curricula & PDF Report Cards
* **Status**: `NOT_STARTED`
* **Cakupan**: Kurikulum formal Kemendikbud/Kemenag, kurikulum diniyah pesantren, input nilai harian/ujian, cetak Rapor PDF otomatis.

### [Phase 6] Learning Management System (LMS) & Online Examinations
* **Status**: `NOT_STARTED`
* **Cakupan**: Bank soal, ujian daring objektif (CBT) otomatis, materi bahan ajar digital, pengumpulan tugas santri.

### [Phase 7] Pesantren, Dormitory (Asrama), Tahfiz & Halaqah
* **Status**: `NOT_STARTED`
* **Cakupan**: Pembagian kamar asrama, penugasan musyrif, log setoran ziyadah & muroja'ah tahfiz, izin santri keluar asrama.

### [Phase 8] Communication Center & Student Development
* **Status**: `NOT_STARTED`
* **Cakupan**: Tiket keluhan rahasia orang tua, rekam poin pelanggaran & prestasi, buku catatan Bimbingan Konseling (BK) berproteksi khusus.

### [Phase 9] SaaS Subscription & Developer Control Center
* **Status**: `NOT_STARTED`
* **Cakupan**: Manajemen lisensi multi-tenant, aktivasi fitur per modul, monitoring performa database & server secara real-time.

### [Phase 10] Security Audit, Load Testing & Production Deployment
* **Status**: `NOT_STARTED`
* **Cakupan**: Uji penetrasi cross-tenant, stress test 3.000 concurrent students, drill pemulihan backup database, rilis live VPS produksi.
