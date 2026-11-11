# Changelog

All notable changes to the **Integrated School & Pesantren Management SaaS** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-11-11

### Phase 0: Architecture, Database Design, System Documentation & Monorepo Scaffolding

#### Added
- **Monorepo Structure**:
  - Root `package.json` with npm workspaces (`apps/*`, `packages/*`).
  - Standardized `.gitignore`, `.editorconfig`, and environment template (`.env.example`).
  - Scaffolding for `apps/api` (NestJS), `apps/web` (React + Tailwind), `apps/mobile` (Flutter + Drift), `packages/shared-types`, and `packages/api-contracts`.
- **Infrastructure**:
  - `infrastructure/docker-compose.yml` provisioning PostgreSQL 16, Redis 7, and MinIO S3 object storage.
  - `infrastructure/postgres/init-rls.sql` providing session variable helper functions (`current_tenant_id()`, `is_super_admin_bypass()`, `uuid-ossp`).
- **CI/CD Automation**:
  - `.github/workflows/ci.yml` defining automated jobs for NestJS, React, Flutter, and shared packages quality and tests.
- **Master Documentation Suite**:
  - `README.md`: Project identity, stack overview, quickstart instructions, and phased roadmap.
  - `docs/ARCHITECTURE.md`: Modular monolith architecture, domain boundaries, RLS multi-tenancy model, horizontal scaling.
  - `docs/DATABASE.md`: 28 normalized core database schemas, compound indexing, and migration rules.
  - `docs/API.md`: Standard JSON response envelope, error codes, REST standards, pagination, and idempotency headers.
  - `docs/SECURITY.md`: Zero-trust security model, JWT lifecycle, password hashing, and Indonesian UU PDP compliance.
  - `docs/OFFLINE_SYNC.md`: Flutter Drift/SQLite offline-first sync protocol, conflict resolution, and signed dynamic QR attendance.
  - `docs/USER_ROLES.md`: 12 system roles, granular permission matrices, and multi-guardian relationships.
  - `docs/DEPLOYMENT.md`: Multi-stage Docker containerization, staging/production topologies, zero-downtime migrations.
  - `docs/DEVELOPMENT_GUIDE.md`: 20 development rules, local environment setup, and conventional commits.
