# REST API Specification & Standards

## 1. Architectural Conventions

All REST endpoints follow standard conventions:
- **Base URL**: `https://api.edusaas.id/api/v1` (or `http://localhost:4000/api/v1` in local development)
- **Content Type**: `application/json; charset=utf-8`
- **Date/Time Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`) in UTC.
- **ID Representation**: UUIDv4 strings.

---

## 2. Standard Response Envelope

Every API response is wrapped in a consistent, predictable JSON envelope.

### 2.1 Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": {
    "id": "c7a8b9f0-21a4-4e78-9b8e-1f7c2e3d4a5b",
    "fullName": "Ahmad Fauzi",
    "nis": "20260012"
  },
  "meta": {
    "timestamp": "2026-11-11T07:45:00.000Z",
    "requestId": "req_f893478912",
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalRecords": 150,
      "totalPages": 8
    }
  }
}
```

### 2.2 Error Response (`400`, `401`, `403`, `404`, `409`, `422`, `500`)
```json
{
  "success": false,
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Validation failed for student registration payload",
  "errorCode": "VALIDATION_FAILED",
  "details": [
    {
      "field": "nis",
      "issue": "NIS must be unique within the tenant"
    },
    {
      "field": "birthDate",
      "issue": "Birth date cannot be in the future"
    }
  ],
  "meta": {
    "timestamp": "2026-11-11T07:45:00.000Z",
    "requestId": "req_f893478912"
  }
}
```

---

## 3. Standard HTTP & Application Error Codes

| Status Code | Meaning | Common Usage |
| :--- | :--- | :--- |
| `200 OK` | Success | GET, PUT, PATCH successful operations. |
| `201 Created` | Created | Resource successfully created via POST. |
| `204 No Content` | Deleted | Successful DELETE with no response body. |
| `400 Bad Request` | Malformed Request | Syntax errors, invalid URL parameters. |
| `401 Unauthorized` | Unauthenticated | Missing, expired, or invalid JWT access token. |
| `403 Forbidden` | Access Denied | Authenticated user lacks permission or crosses tenant boundary. |
| `404 Not Found` | Not Found | Requested entity does not exist in the tenant. |
| `409 Conflict` | Conflict | Duplicate entry, optimistic lock failure, or duplicate transaction. |
| `422 Unprocessable` | Validation Error | DTO validation rules violated (`class-validator`). |
| `429 Too Many Req` | Rate Limited | Exceeded per-minute or per-hour request quotas. |
| `500 Server Error` | Internal Failure | Unhandled backend exception (sanitized in production). |

---

## 4. Authentication & Authorization Headers

1. **Authorization**:
   ```http
   Authorization: Bearer <jwt-access-token>
   ```
2. **Tenant Scoping**:
   ```http
   X-Tenant-ID: <tenant-uuid>
   ```
   *(Required if not using dedicated tenant subdomain or if token holds multi-tenant access).*
3. **Idempotency Key (Mandatory for Payments & Invoicing)**:
   ```http
   Idempotency-Key: <unique-uuidv4-from-client>
   ```
   *Guarantees safe retries without duplicate billing or double charges.*

---

## 5. Pagination, Filtering & Sorting Standards

All list endpoints support unified query parameters:

- **Pagination**: `?page=1&limit=25` (defaults: `page=1`, `limit=20`, max `limit=100`).
- **Sorting**: `?sortBy=createdAt&sortOrder=desc` (`asc` or `desc`).
- **Searching**: `?search=keyword` (matches full-text or prefix indexes).
- **Date Filtering**: `?startDate=2026-01-01&endDate=2026-06-30`.
- **Status Filtering**: `?status=ACTIVE,PENDING`.

---

## 6. Core API Endpoints Directory (Summary)

### 6.1 Authentication (`/auth`)
- `POST /auth/login` - Authenticate with email/phone & password.
- `POST /auth/refresh` - Rotate refresh token & issue new short-lived access token.
- `POST /auth/logout` - Revoke current refresh token session.
- `POST /auth/switch-role` - Switch active role for accounts with multiple roles.

### 6.2 Master Data (`/master`)
- `GET/POST /master/institutions` - School sub-units.
- `GET/POST /master/academic-years` - Academic calendars.
- `GET/POST /master/classes` - Class groups.
- `GET/POST /master/students` - Student records and profiles.
- `GET/POST /master/guardians` - Guardian records and relationships.
- `GET/POST /master/employees` - Teacher and staff profiles.

### 6.3 Attendance & Sync (`/attendance`)
- `POST /attendance/scan` - Process real-time QR attendance scan.
- `POST /attendance/sync-batch` - Ingest offline attendance records from mobile SQLite queue.
- `GET /attendance/qr-token` - Issue time-bounded, cryptographically signed dynamic QR token.
- `GET /attendance/reports` - Daily/monthly attendance summary reports.

### 6.4 Finance & Billing (`/finance`)
- `GET/POST /finance/invoices` - Generate and manage student invoices.
- `POST /finance/payments` - Process cash or gateway payments (idempotent).
- `POST /finance/webhooks/qris` - Webhook receiver for QRIS payments.
- `POST /finance/webhooks/va` - Webhook receiver for Virtual Account payments.
- `GET /finance/reports/cash-flow` - Cash flow and balance sheet reports.

### 6.5 Pesantren & Tahfiz (`/pesantren`)
- `GET/POST /pesantren/dormitories` - Dormitory buildings and room capacity.
- `POST /pesantren/dorm-allocations` - Room assignment.
- `GET/POST /pesantren/tahfiz` - Quran memorization records (ziyadah/muroja'ah).
- `GET/POST /pesantren/halaqah` - Halaqah study group management.

### 6.6 SaaS Developer Control Center (`/admin/dev-center`)
- `GET/POST /admin/dev-center/tenants` - Multi-tenant institution lifecycle.
- `GET/PATCH /admin/dev-center/subscriptions` - Subscription quotas and tier controls.
- `GET /admin/dev-center/metrics` - Server health, active users, database metrics.
