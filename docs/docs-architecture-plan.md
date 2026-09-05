# Architecture Documentation Plan

## Top-Level Overview

**Goal:** Produce a comprehensive, accurate `docs/ARCHITECTURE.md` file for the Enterprise Dashboard project — covering system design, service architecture, data flows, infrastructure, security, and coding conventions.

**Scope:**
- One markdown document at `docs/ARCHITECTURE.md`
- Covers all 5 services (IAM, Engine, Analytics, Recon, Frontend) plus infrastructure
- Includes Mermaid diagrams for data flows and service topology
- References actual file paths so engineers can navigate the codebase
- Written in **Bahasa Indonesia** (target audience: developer/architect tim internal)
- Complements `Technical_Specification.md` (does not replace it)

**Non-goals:**
- No code changes whatsoever
- No per-service README duplication
- No runbook or operational playbook (that belongs in separate ops docs)

---

## Sub-Tasks

### Sub-Task 1 — Create `docs/` directory and write `ARCHITECTURE.md`

**Status:** `[ ] pending`

**Intent:**
Write a single, well-structured `docs/ARCHITECTURE.md` that serves as the authoritative architecture reference for the project. This is the primary deliverable of this plan.

**Expected Outcomes:**
- File `docs/ARCHITECTURE.md` exists and is readable
- Covers all sections listed in the Todo List below
- All file path references are accurate (verified from codebase exploration)
- No placeholder text remains

**Todo List:**
1. Create the `docs/` directory (if it doesn't already exist)
2. Write `docs/ARCHITECTURE.md` with the following sections:

   **1. Project Overview**
   - Purpose of the system (enterprise financial data management, QRIS reconciliation)
   - High-level architecture: microservices, event-driven, multi-database

   **2. System Topology**
   - List all services: IAM, Engine, Analytics, Recon, Frontend, Infrastructure
   - Entry point: Traefik API Gateway on port 80
   - How routing works (path-based routing to each service)

   **3. Service-by-Service Architecture**
   For each of the 5 services, document:
   - Responsibility / purpose
   - Tech stack
   - Key files (with relative paths)
   - API routes exposed
   - Database schema used
   - Notable design patterns

   Services to document:
   - `ent-dash-iam/` — Authentication, RBAC, Audit, Compliance
   - `ent-dash-engine/` — File Imports, CSV Processing, gRPC Server, Data Explorer
   - `ent-dash-analytics/` — Financial Metrics, QRIS Analysis, gRPC Client, Redis Cache
   - `ent-dash-recon/` — Reconciliation Engine (QRIS AJ, Rintis, ONUS), Celery Workers
   - `ent-dash-fe/` — Next.js Frontend, shadcn/ui, Context/Service layers

   **4. Infrastructure & DevOps**
   - Docker Compose services (all 15 containers)
   - Traefik routing table
   - PostgreSQL multi-database setup (4 databases, per-service schemas)
   - Redis (Celery broker + Analytics cache)
   - MinIO S3 (file storage for imports)
   - Redpanda/Kafka (async event bus)
   - Observability stack (Prometheus + Grafana)

   **5. Data Flows**
   - File Import Flow: Upload → MinIO → Kafka → Celery → DB → Analytics sync
   - Authentication Flow: Login → JWT → Protected route → RBAC check
   - Analytics Query Flow: Frontend → Analytics API → Redis cache or gRPC → Engine DB
   - Reconciliation Flow: Kafka event → Celery task → Pandas matching → DB results

   **6. Database Architecture**
   - 4 PostgreSQL databases, each service owns its schema
   - Schema list per service (tables, their purpose)
   - Alembic migration strategy

   **7. Security Architecture**
   - JWT stateless auth (HS256, no session table)
   - RBAC (Spatie-like: roles/permissions/model_has_roles)
   - Audit logging and forensic trail
   - UU PDP compliance module
   - Rate limiting (Traefik: 10 req/min on login)
   - SQL injection prevention (SQLAlchemy ORM parameterized queries)
   - Data Explorer whitelist (9 approved tables)

   **8. Coding Conventions**
   - Backend OOP rules (Service, Repository, Controller layers)
   - Frontend conventions (shadcn/ui only, service layer for API calls)
   - DRY / KISS / Modularity principles
   - No hardcoded static data

   **9. Testing Strategy**
   - Backend: Pytest per service
   - Frontend: Jest + @testing-library/react
   - Verification harness: `./init.sh`
   - Test locations (per service `tests/` directory)

   **10. Environment & Configuration**
   - Required environment variables (from `.env.example`)
   - How `docker-compose.yml` wires everything together
   - Local development setup

**Relevant Context:**
- `docker-compose.yml` — Full service definitions and Traefik labels
- `ent-dash-engine/app/main.py` — Engine FastAPI app setup
- `ent-dash-iam/app/main.py` — IAM FastAPI app setup
- `ent-dash-analytics/app/main.py` — Analytics FastAPI app setup
- `ent-dash-recon/app/main.py` — Recon FastAPI app setup
- `ent-dash-fe/app/layout.tsx` — Frontend root layout
- `ent-dash-fe/next.config.ts` — API rewrites and CSP
- `ent-dash-engine/alembic/versions/7f0ad24746be_init_ent_dash_engine.py` — Engine DB schema
- `ent-dash-iam/alembic/versions/` — IAM DB schema
- `ent-dash-engine/app/tasks/imports.py` — Celery data import pipeline
- `ent-dash-analytics/app/core/grpc_client.py` — gRPC client setup
- `ent-dash-recon/app/tasks/reconciliation.py` — Reconciliation algorithms
- `AGENTS.md` — Coding rules and harness principles
- `.env.example` — Environment variable template

---

## Notes

- The document must be based **only on what exists in the codebase** — no speculation
- File path references should use format `ent-dash-engine/app/services/imports.py` (relative to root)
- Keep language technical but readable; use tables where lists would be cluttered
- Mermaid diagrams are acceptable in the markdown for data flow sections
