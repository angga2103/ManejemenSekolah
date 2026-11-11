# Multi-Tenant Data Isolation Specification

## 1. Prinsip Isolasi Data Multi-Tenant

Dalam platform SaaS pendidikan yang melayani ratusan hingga ribuan sekolah dan pondok pesantren, **kebocoran data lintas institusi (cross-tenant data leakage) adalah risiko fatal yang tidak dapat ditoleransi**.

Sistem menerapkan prinsip **Defense in Depth** dengan 3 lapisan pertahanan:
1. **Lapisan 1: PostgreSQL Row-Level Security (RLS)** pada level basis data.
2. **Lapisan 2: NestJS Tenant Context Interceptor & Prisma Client Extensions** pada level backend.
3. **Lapisan 3: S3/MinIO Prefix Isolation** pada level berkas/dokumen.

---

## 2. Lapisan 1: PostgreSQL Row-Level Security (RLS)

Setiap tabel operasional memiliki kolom:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT
```

### 2.1 Konfigurasi RLS
PostgreSQL RLS diaktifkan pada seluruh tabel operasional:
```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
```

### 2.2 Kebijakan Isolasi Data (Tenant Policy)
```sql
CREATE POLICY tenant_isolation_policy ON students
    FOR ALL
    USING (
        tenant_id = current_tenant_id() 
        OR is_super_admin_bypass()
    );
```

### 2.3 Penetapan Konteks Sesi Transaksi
Ketika aplikasi NestJS membuka transaksi basis data untuk memproses request pengguna, aplikasi mengeksekusi:
```sql
SET LOCAL app.current_tenant_id = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
```
Konteks ini bersifat lokal pada transaksi (`LOCAL`), sehingga tidak akan mencemari koneksi lain di connection pool (*PgBouncer / Prisma connection pool*).

### 2.4 Kebijakan Super Admin Bypass
Akses lintas tenant hanya diizinkan untuk fungsi administrasi platform global SaaS Super Admin dengan mencatat audit log keamanan secara ketat:
```sql
SET LOCAL app.is_super_admin = 'true';
```

---

## 3. Lapisan 2: Penegakan pada Level Aplikasi (NestJS & Prisma)

### 3.1 Resolusi Tenant (Tenant Resolution Strategy)
Tenant dikenali melalui salah satu metode berikut (urutan prioritas):
1. **Subdomain HTTP**: `https://pesantren-alikhlas.edusaas.id` -> Subdomain `pesantren-alikhlas`.
2. **Header Khusus**: `X-Tenant-ID: <uuid>` (digunakan oleh API Klien Mobile).
3. **Klaim Token JWT**: Atribut `tenant_id` di dalam payload JWT access token yang sudah terverifikasi tanda tangannya.

### 3.2 Asynchronous Local Storage (Tenant Context)
NestJS menggunakan Node.js `AsyncLocalStorage` untuk menyimpan konteks tenant sepanjang siklus hidup eksekusi request (dari controller, service, hingga database query) tanpa perlu mengoper `tenantId` secara manual di setiap argumen fungsi.

### 3.3 Prisma Client Extension Enforcement
Prisma Client dikonfigurasi dengan middleware query extension:
```typescript
prisma.$extends({
  query: {
    $allModels: {
      async findMany({ args, query }) {
        const tenantId = TenantContext.getTenantId();
        if (tenantId) {
          args.where = { ...args.where, tenantId };
        }
        return query(args);
      },
    },
  },
});
```

---

## 4. Lapisan 3: Isolasi Dokumen & File (Object Storage)

Berkas siswa, dokumen pendaftaran, struk pembayaran, dan rekaman audio/video hafalan Al-Qur'an disimpan pada S3-compatible object storage dengan partisi folder:

```
s3://edusaas-documents/
  ├── tenants/
  │   ├── {tenant_id_1}/
  │   │   ├── students/{student_id}/avatar.jpg
  │   │   ├── invoices/{invoice_id}/receipt.pdf
  │   │   └── tahfiz/{tahfiz_id}/audio.mp3
  │   └── {tenant_id_2}/
  │       └── ...
```

Akses ke berkas privat wajib menggunakan **Pre-Signed URL** dengan masa kedaluwarsa maksimal 15 menit yang di-generate oleh backend setelah memvalidasi kepemilikan tenant.

---

## 5. Rencana Pengujian Isolasi Data (Cross-Tenant Test Strategy)

Pada tahap pengujian otomatis, suite pengujian cross-tenant wajib memverifikasi:
1. **Uji Akses Silang Mahasiswa**: User dari Tenant A tidak dapat membaca atau memodifikasi data santri dari Tenant B via `GET /api/v1/master/students/:id_tenant_b` (harus menghasilkan `404 Not Found` atau `403 Forbidden`).
2. **Uji Penetrasi Finansial**: Transaksi pembayaran Tenant A tidak dapat melunasi tagihan (invoice) milik Tenant B.
3. **Uji Injeksi Header**: Manipulasi header `X-Tenant-ID` yang tidak sesuai dengan tanda tangan JWT pengguna wajib langsung ditolak dengan `403 Forbidden`.
