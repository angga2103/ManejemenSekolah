# Integrated School & Pesantren Management SaaS

> **A Multi-Tenant SaaS Education Platform engineered for formal schools and Islamic boarding schools (pondok pesantren) within a unified, high-integrity ecosystem.**

[![CI Pipeline](https://github.com/vermilii/edusaas/actions/workflows/ci.yml/badge.svg)](https://github.com/vermilii/edusaas/actions)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-blue.svg)](#license)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D20.0.0-green.svg)](https://nodejs.org/)
[![Flutter Version](https://img.shields.io/badge/Flutter-3.47.5-blue.svg)](https://flutter.dev/)

---

## 1. Project Overview

The **Integrated School & Pesantren Management SaaS** platform bridges the dual requirements of modern national formal education and Islamic boarding school (pesantren) life. It provides end-to-end administration, academics, financial auditability, offline-first attendance verification, and guardian communication.

### Key Capabilities
- **Multi-Tenant SaaS**: Complete operational and data isolation per educational institution via PostgreSQL Row-Level Security (RLS) and tenant-bound backend guards.
- **Dual Curriculum**: Support for Kemendikbudristek/Kemenag formal curricula alongside Pesantren Diniyah, Tahfiz, Halaqah, and Musyrif dorm operations.
- **Offline-First Attendance**: Field attendance scanning with mobile SQLite/Drift, write-ahead queues, cryptographic token validation, and automatic conflict-free sync.
- **Immutable Financial Engine**: Invoicing, payment reconciliation (Cash, QRIS, Virtual Account), digital receipts, journals, ledgers, and transparency reporting.
- **Granular RBAC**: 12 system roles with customizable permission matrices and multi-role account support.
- **Parent & Guardian Ecosystem**: 1:M and M:1 guardian-student linkages, tiered access, in-app notifications, and WhatsApp/FCM messaging.

---

## 2. Architecture & Monorepo Structure

```
├── .github/
│   └── workflows/          # GitHub Actions CI/CD workflows
├── apps/
│   ├── api/                # NestJS + Prisma modular monolith REST backend
│   ├── web/                # React + TypeScript + Tailwind administrative web portal
│   └── mobile/             # Flutter + Drift offline-first mobile app (Android & iOS)
├── packages/
│   ├── shared-types/       # Cross-platform TypeScript interfaces, DTOs, and enums
│   └── api-contracts/      # OpenAPI / REST contracts and payload validators
├── docs/                   # Full technical specification & architecture documentation
├── infrastructure/         # Docker Compose, PostgreSQL RLS init, Redis, and MinIO configs
├── package.json            # Monorepo workspaces definition
└── .env.example            # Environment variables specification
```

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | NestJS, TypeScript, Prisma ORM, BullMQ, Swagger/OpenAPI |
| **Database & Cache** | PostgreSQL 16 (RLS, UUIDv4), Redis 7 (caching, task queues) |
| **Object Storage** | S3-Compatible / MinIO (tenant-isolated document storage) |
| **Mobile App** | Flutter (Dart), SQLite with Drift, Flutter Secure Storage |
| **Web Portal** | React, TypeScript, Tailwind CSS, TanStack Query, Vite |
| **Notifications** | Firebase Cloud Messaging (FCM), WhatsApp Business API Ready |
| **Infrastructure** | Docker, Docker Compose, GitHub Actions |

---

## 4. Documentation Index

For exhaustive technical blueprints, refer to our core documentation files:

* [**Architecture Blueprint**](file:///docs/ARCHITECTURE.md) - Modular monolith boundaries, multi-tenancy model, RLS.
* [**Database Specification**](file:///docs/DATABASE.md) - 28 normalized domain schemas, indexing, and migration rules.
* [**API Standards**](file:///docs/API.md) - REST conventions, envelope format, error codes, and auth flows.
* [**Security & Data Privacy**](file:///docs/SECURITY.md) - Tenant isolation, JWT rotation, and Indonesian UU PDP compliance.
* [**Offline-First & Sync Protocol**](file:///docs/OFFLINE_SYNC.md) - Drift queueing, conflict resolution, QR cryptography.
* [**User Roles & RBAC Matrix**](file:///docs/USER_ROLES.md) - 12 role definitions, permissions, and guardian mappings.
* [**Deployment Guide**](file:///docs/DEPLOYMENT.md) - Staging and production container orchestration.
* [**Development Guide**](file:///docs/DEVELOPMENT_GUIDE.md) - Local environment setup and testing workflows.
* [**Changelog**](file:///CHANGELOG.md) - Semantic versioning history.

---

## 5. Quickstart Development

### Prerequisites
- Node.js `>= 20.0.0`
- npm `>= 10.0.0`
- Docker & Docker Compose
- Flutter `>= 3.47.0` (for mobile development)

### Step-by-Step Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vermilii/edusaas.git
   cd edusaas
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```

3. **Start Local Infrastructure (PostgreSQL, Redis, MinIO):**
   ```bash
   npm run infra:up
   ```

4. **Install Dependencies:**
   ```bash
   npm install
   ```

5. **Run Prisma Migrations & Generate Client:**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

6. **Start Backend API:**
   ```bash
   npm run dev:api
   # API runs on http://localhost:4000/api/v1
   # Swagger Docs at http://localhost:4000/api/docs
   ```

7. **Start Web Portal:**
   ```bash
   npm run dev:web
   # Portal runs on http://localhost:3000
   ```

---

## 6. Phased Roadmap

| Phase | Description | Status |
| :---: | :--- | :---: |
| **Phase 0** | Architecture, Database Design, System Documentation & Monorepo Scaffolding | **In Progress** |
| **Phase 1** | Authentication, Multi-Tenancy Engine & Granular RBAC Permissions | Planned |
| **Phase 2** | Master Data & Student/Institution Management | Planned |
| **Phase 3** | Attendance Engine, Offline Synchronization & Notifications | Planned |
| **Phase 4** | Financial Management, Billing & Payment Gateway Integration | Planned |
| **Phase 5** | Academic Management, Dual Curricula & PDF Report Cards | Planned |
| **Phase 6** | Learning Management System (LMS) & Online Examinations | Planned |
| **Phase 7** | Pesantren, Dormitory (Asrama), Tahfiz & Halaqah | Planned |
| **Phase 8** | Communication Center & Student Development/Counseling | Planned |
| **Phase 9** | SaaS Subscription & Developer Control Center | Planned |
| **Phase 10** | Security Hardening, Load Testing & Production Deployment | Planned |

---

## 7. License
Proprietary & Confidential. All rights reserved.
