# Architecture Diagrams & Visual Workflows

Dokumen ini memuat diagram alur teknis komprehensif menggunakan format standar **Mermaid** untuk memvisualisasikan seluruh alur kerja inti sistem.

---

## 1. Diagram Arsitektur Sistem Menyeluruh (System Architecture)

```mermaid
flowchart TD
    subgraph Clients["Lapisan Klien (Clients Layer)"]
        FlutterApp["Aplikasi Mobile Flutter\n(Android & iOS - Offline First)"]
        ReactWeb["Web Portal Administrasi & Guru\n(React 18 + Tailwind CSS)"]
        SuperAdmin["SaaS Developer Control Center\n(React Web Console)"]
    end

    subgraph Ingress["Ingress & Reverse Proxy"]
        ReverseProxy["Reverse Proxy / SSL Termination\n(Nginx / Caddy + Cloudflare WAF)"]
    end

    subgraph Backend["NestJS Modular Monolith API"]
        TenantGuard["Tenant Resolution & RLS Guard"]
        AuthMod["IAM & RBAC Module"]
        MasterMod["Master Data Module"]
        AttendMod["Attendance & Field Sync Module"]
        FinMod["Finance & Payment Ledger Module"]
        AcadMod["Academic & Dual Curricula Module"]
        PesantrenMod["Pesantren, Asrama & Tahfiz Module"]
        LMSMod["LMS & Examination Module"]
        CommMod["Communication & Notification Module"]
    end

    subgraph StorageQueue["Penyimpanan & Antrean (Storage & Queues)"]
        Postgres[("PostgreSQL 16\n(Multi-Tenant RLS)")]
        RedisCache[("Redis 7\n(Sessions & Task Queue)")]
        BullWorker["BullMQ Worker\n(Asynchronous Job Processor)"]
        MinIO[("Object Storage S3/MinIO\n(Tenant-Isolated Files)")]
        FCMService["Firebase Cloud Messaging (FCM)"]
    end

    Clients --> ReverseProxy
    ReverseProxy --> TenantGuard
    TenantGuard --> AuthMod
    TenantGuard --> MasterMod
    TenantGuard --> AttendMod
    TenantGuard --> FinMod
    TenantGuard --> AcadMod
    TenantGuard --> PesantrenMod
    TenantGuard --> LMSMod
    TenantGuard --> CommMod

    Backend --> Postgres
    Backend --> RedisCache
    Backend --> MinIO
    RedisCache --> BullWorker
    BullWorker --> Postgres
    BullWorker --> FCMService
```

---

## 2. Alur Autentikasi & Refresh Token Rotation (Authentication Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Pengguna (Web / Mobile)
    participant Client as Aplikasi Klien
    participant API as NestJS Auth Controller
    participant DB as PostgreSQL
    participant Redis as Redis Cache

    User->>Client: Input Identitas (Email/Phone) & Password
    Client->>API: POST /api/v1/auth/login { identifier, password, tenantSlug }
    API->>DB: Query User & Validasi Password Hash (Bcrypt)
    API->>DB: Ambil Peran (Roles) & Izin (Permissions) Aktif
    API->>API: Generate Access Token (15m) & Refresh Token (7d)
    API->>DB: Simpan Hashed Refresh Token
    API->>Redis: Catat ID Sesi Aktif
    API-->>Client: 200 OK { user, tokens: { accessToken, refreshToken, expiresIn } }
    
    Note over Client,API: Setelah 15 Menit (Access Token Kadaluarsa)
    Client->>API: POST /api/v1/auth/refresh { refreshToken }
    API->>DB: Verifikasi Token Hash & Cek Status Revokasi
    alt Token Valid
        API->>DB: Hanguskan (Revoke) Token Lama
        API->>API: Terbitkan Pasangan Token Baru (Rotation)
        API->>DB: Simpan Hashed Token Baru
        API-->>Client: 200 OK { tokens: { accessToken, refreshToken } }
    else Token Tidak Valid / Replay Attack Terdeteksi
        API->>DB: Cabut Seluruh Token Family Pengguna
        API-->>Client: 401 Unauthorized (Paksa Re-Login)
    end
```

---

## 3. Siklus Hidup Request Multi-Tenant (Tenant Request Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Klien Mobile / Web
    participant Proxy as Ingress (Nginx)
    participant Middleware as Tenant Middleware
    participant Guard as Tenant & RBAC Guard
    participant Service as Business Logic Service
    participant RLS as PostgreSQL (RLS Context)

    Client->>Proxy: Request API (Header: Bearer Token, X-Tenant-ID)
    Proxy->>Middleware: Teruskan Request
    Middleware->>Middleware: Ekstrak Subdomain / Header / Token Tenant ID
    Middleware->>Middleware: Validasi Status Tenant (Active, Trial, Suspended)
    Middleware->>Guard: Loloskan ke Auth & Permission Guard
    Guard->>Guard: Verifikasi Hak Akses Modul (Contoh: FINANCE.CREATE)
    Guard->>Service: Eksekusi Method Service
    Service->>RLS: BEGIN TRANSACTION;
    Service->>RLS: SET LOCAL app.current_tenant_id = 'tenant-uuid';
    Service->>RLS: Query Tabel Operasional (Otomatis difilter RLS)
    RLS-->>Service: Hasil Data Khusus Tenant
    Service->>RLS: COMMIT TRANSACTION;
    Service-->>Client: Response Data Terisolasi
```

---

## 4. Alur Presensi Offline & Sinkronisasi Lapangan (Attendance Synchronization)

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Petugas Presensi (Mobile)
    actor Student as Siswa / Santri
    participant DriftDB as Drift SQLite (Lokal HP)
    participant SyncQueue as Write-Ahead Queue
    participant API as NestJS Attendance API
    participant CentralDB as Central PostgreSQL

    Student->>Student: Buka QR Dinamis (Berubah tiap 60 detik)
    Officer->>Student: Pindai QR Siswa menggunakan Kamera (Kondisi Offline)
    Officer->>Officer: Verifikasi Tanda Tangan Kriptografis (HMAC-SHA256)
    Officer->>DriftDB: Simpan Record Presensi ke SQLite Lokal
    Officer->>SyncQueue: Tambahkan Payload Presensi (UUID, Timestamp, Status PENDING)
    Officer-->>Student: Tampilkan Indikator Hijau "Presensi Berhasil (Offline)"

    Note over Officer,API: Perangkat Mendapatkan Sinyal Internet (Wi-Fi/4G)
    SyncQueue->>API: POST /api/v1/attendance/sync-batch (Batch 50 items + Idempotency-Key)
    API->>CentralDB: Validasi Duplikasi (Deduplikasi Waktu Terawal)
    API->>CentralDB: Simpan Presensi Resmi ke PostgreSQL
    API-->>SyncQueue: Ack Berhasil { successIds: [...] }
    SyncQueue->>DriftDB: Ubah Status Antrean Menjadi COMPLETED
```

---

## 5. Alur Pembayaran Finansial & Idempotensi (Financial Payment Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Wali Santri / Orang Tua
    participant Portal as Web / Mobile Portal
    participant API as NestJS Finance Module
    participant Gateway as Payment Gateway (QRIS / VA)
    participant DB as PostgreSQL Ledger

    Parent->>Portal: Pilih Tagihan SPP Bulanan
    Portal->>API: POST /api/v1/finance/payments/request { invoiceId, method: "QRIS", Idempotency-Key }
    API->>DB: Periksa Idempotency Key (Cegah Duplikasi Request)
    API->>Gateway: Buat Transaksi QRIS / Virtual Account
    Gateway-->>API: Data Kode QRIS / Nomor VA
    API-->>Portal: Tampilkan Kode Pembayaran
    Parent->>Gateway: Lakukan Pembayaran melalui Mobile Banking
    Gateway->>API: Webhook Notifikasi Pembayaran Sukses
    API->>API: Verifikasi Signature Webhook
    API->>DB: BEGIN TRANSACTION (Serializable);
    API->>DB: Update Status Tagihan (Invoice -> PAID)
    API->>DB: Catat Transaksi Pembayaran (Payment Record)
    API->>DB: Buat Jurnal Akuntansi Kas Masuk (Double-Entry Ledger)
    API->>DB: COMMIT TRANSACTION;
    API-->>Parent: Kirim Notifikasi Struk Digital & WhatsApp
```

---

## 6. Alur Pengiriman Notifikasi Multi-Channel (Notification Delivery)

```mermaid
sequenceDiagram
    autonumber
    participant Event as Sistem Pemicu (Presensi / Finansial)
    participant Queue as BullMQ (Redis)
    participant Worker as Notification Worker
    participant FCM as Firebase Cloud Messaging
    participant WA as WhatsApp Business API Gateway
    actor Guardian as Wali Santri (Device)

    Event->>Queue: Push Job: SEND_GUARDIAN_ALERT { studentId, title, message, channels }
    Queue->>Worker: Ambil Job Asinkron
    Worker->>Worker: Cek Preferensi Notifikasi Wali Santri
    par Saluran Push Notifikasi
        Worker->>FCM: Kirim Push Notification ke Token Perangkat
        FCM-->>Guardian: Tampilkan Banner Notifikasi di Aplikasi
    and Saluran WhatsApp
        Worker->>WA: Kirim Template Pesan WhatsApp Resmi
        WA-->>Guardian: Pesan WA Masuk
    end
    Worker->>Queue: Konfirmasi Job Selesai (Job Completed)
```

---

## 7. Topologi Deployment Infrastruktur Produksi (Deployment Topology)

```mermaid
flowchart TD
    subgraph PublicInternet["Jaringan Publik (Internet)"]
        Users["Pengguna (Siswa, Wali, Guru, Admin)"]
    end

    subgraph SecurityPerimeter["Edge Security & CDN"]
        Cloudflare["Cloudflare (WAF, DDOS Protection, SSL)"]
    end

    subgraph VPS["Host Ubuntu VPS (Docker Orchestration)"]
        NginxProxy["Nginx / Caddy Gateway\n(Port 80/443 -> Internal Port)"]
        
        subgraph AppContainers["Container Aplikasi"]
            WebContainer["Frontend Web Container\n(Nginx Static Server - Port 3000)"]
            APIContainer["Backend API Container\n(NestJS Node 20 - Port 4000)"]
            WorkerContainer["Background Worker Container\n(BullMQ Processor)"]
        end

        subgraph DataContainers["Container Data (Isolated Network)"]
            PGContainer[("PostgreSQL 16 Container\n(Data Volume: /var/lib/postgresql)")]
            RedisContainer[("Redis 7 Container\n(Persistence: AOF/RDB)")]
            MinioContainer[("MinIO S3 Storage Container\n(Storage Volume: /data)")]
        end
    end

    Users --> Cloudflare
    Cloudflare --> NginxProxy
    NginxProxy --> WebContainer
    NginxProxy --> APIContainer
    APIContainer --> PGContainer
    APIContainer --> RedisContainer
    APIContainer --> MinioContainer
    WorkerContainer --> RedisContainer
    WorkerContainer --> PGContainer
```
