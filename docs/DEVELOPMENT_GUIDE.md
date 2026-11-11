# Development Guide & Coding Standards

## 1. Development Principles & 20 Golden Rules

All engineers and AI agents working on this codebase must strictly observe these rules:

1. **Inspect Before Changing**: Inspect the existing repository and files before proposing or applying modifications.
2. **Preserve Working Functionality**: Existing functional features must never be broken by subsequent iterations.
3. **Plan Before Coding**: Create an explicit implementation plan before beginning implementation work.
4. **Follow Modular Architecture**: Maintain strict domain boundaries between modules (Auth, Tenancy, Master, Finance, Academic, Pesantren).
5. **Avoid Giant Files**: Break code into cohesive controllers, services, repositories, DTOs, and entities.
6. **Test Critical Logic**: Write automated unit and integration tests for all business logic, calculations, and financial handlers.
7. **Validate Every Request**: Never accept raw payloads. Use `class-validator` DTOs with strict white-listing on all incoming requests.
8. **Never Trust Frontend Authorization**: Frontend checks are for UX only; backend security guards and RLS provide real security.
9. **Use Versioned Migrations**: All schema modifications require Prisma migrations checked into source control.
10. **Document Architectural Decisions**: Keep architectural records updated when introducing patterns or third-party dependencies.
11. **Keep Documentation Synchronized**: Maintain `README.md`, `CHANGELOG.md`, and technical specifications alongside code changes.
12. **Semantic Versioning & Changelog**: Record all additions, fixes, and breaking changes in `CHANGELOG.md`.
13. **Commit in Logical Units**: Use conventional commit syntax (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
14. **Push to Configured GitHub Repository**: Keep remote repositories synchronized on milestone completions.
15. **Evidence-Based Completion**: Never claim a feature is complete without implementation code and verified test evidence.
16. **Zero Untested Migrations in Production**: Test all database migration up and down scripts in development and staging first.
17. **Mock Payment Providers Locally**: Always use mock payment adapters during local development and testing.
18. **Never Commit Secrets**: Prevent accidental credential leakage with pre-commit hooks and `.gitignore`.
19. **Report Limitations Transparently**: Highlight any unhandled edge cases, partial implementations, or dependencies honestly.
20. **Working Application at Every Milestone**: Every phase must leave the repository in a compilable, testable, and stable state.

---

## 2. Local Environment Setup

### Required Tooling:
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or higher
- **Docker & Docker Compose**: For containerized databases and services
- **Flutter**: v3.47.x (with Dart 3.13+)

### Setup Commands:
```bash
# 1. Install root & workspace dependencies
npm install

# 2. Launch PostgreSQL, Redis, and MinIO
npm run infra:up

# 3. Apply database migrations & generate client
npm run db:migrate
npm run db:generate

# 4. Start local development servers
npm run dev:api    # Starts NestJS on http://localhost:4000
npm run dev:web    # Starts React on http://localhost:3000
```

---

## 3. Git Workflow & Conventional Commits

- **Main Branch (`main`)**: Production-ready code only.
- **Development Branch (`develop`)**: Integration branch for current release cycle.
- **Feature Branches**: `feat/phase-X-feature-name`.

### Commit Message Format:
```
<type>(<scope>): <short description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: A new user-facing or technical feature
- `fix`: A bug fix
- `docs`: Documentation updates only
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding or correcting tests
- `chore`: Build scripts, CI pipeline, package dependencies
