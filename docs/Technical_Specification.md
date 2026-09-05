# Enterprise Dashboard - Technical Specification Document

## Table of Contents
1. [Tech Stack & System Design](#1-tech-stack--system-design)
2. [Kinds of APIs](#2-kinds-of-apis)
3. [Data Flow Architecture](#3-data-flow-architecture)
4. [Database Architecture](#4-database-architecture)
5. [Testing Strategy](#5-testing-strategy)

---

## 1. Tech Stack & System Design

### 1.1. System Architecture Overview
The Enterprise Dashboard is built using a **Microservices Architecture**. The system is decoupled into distinct services, allowing for independent scaling, development, and deployment. The infrastructure is containerized and managed via **Docker Compose**.

### 1.2. Infrastructure & Gateway
- **API Gateway / Reverse Proxy**: **Traefik v3.0**. 
  - Routes external traffic to appropriate internal microservices based on path prefixes (e.g., `/api/auth` to IAM, `/api/engine` to Engine).
  - Handles rate-limiting (e.g., login attempts) and load balancing.
- **Container Orchestration**: Docker Compose (for local and staging environments).

### 1.3. Frontend Stack
- **Framework**: **Next.js** (React)
- **Styling**: **Tailwind CSS v4** with a premium Glassmorphism design and semantic CSS tokens.
- **UI Components**: **shadcn/ui** (Radix UI primitives).
- **Data Visualization**: Recharts.
- **State Management & Fetching**: SWR, Axios.
- **Form Handling**: React Hook Form with Zod validation.

### 1.4. Backend Microservices Stack
All backend services share a common foundational stack for high performance and asynchronous processing:
- **Framework**: **FastAPI** (Python 3.11+)
- **Server**: Uvicorn (ASGI)
- **ORM**: SQLAlchemy 2.0 with asyncpg (Async PostgreSQL)
- **Migrations**: Alembic

**Core Services**
1. **IAM Service (`ent-dash-iam`)**
   - Responsibilities: Identity and Access Management, User Authentication, Role-Based Access Control (RBAC), Organization Units.
2. **Engine Service (`ent-dash-engine`)**
   - Responsibilities: Core business logic, file imports, and data processing.
   - Features dedicated **Celery Workers** for background job processing.
3. **Analytics Service (`ent-dash-analytics`)**
   - Responsibilities: Aggregating and serving dashboard metrics and data visualizations.
4. **Recon Service (`ent-dash-recon`)**
   - Responsibilities: Data reconciliation processes and matching engines.
5. **Common Library (`ent-dash-common`)**
   - Shared utilities, models, and schemas across all Python microservices.

### 1.5. Message Brokers & Event Streaming
- **Task Queues**: **Celery** backed by Redis.
- **Event Streaming**: **Redpanda** (Kafka-compatible). Used for high-throughput, decoupled event-driven communication between services (e.g., `engine.file_uploaded`, `engine.data_processed`).

### 1.6. Observability & Monitoring
- **Metrics Scraping**: **Prometheus** (via `prometheus-fastapi-instrumentator`).
- **Dashboards**: **Grafana** (configured for embedding in the Superadmin dashboard).
- **Event Monitoring**: Redpanda Console.

---

## 2. Kinds of APIs

The Enterprise Dashboard microservices architecture utilizes multiple protocols and paradigms for API communication, tailored for performance, flexibility, and decoupled processing.

### 2.1. RESTful APIs (Synchronous, External/Internal)
The primary interface between the Frontend client and the Backend microservices is REST over HTTP. 
- **Implementation**: Built using **FastAPI**, which provides auto-generated OpenAPI (Swagger) documentation.
- **Routing**: Traffic is routed by Traefik.
- **Key API Domains**:
  - `IAM Service`: `/api/auth`, `/api/user`, `/api/roles`, `/api/permissions`
  - `Analytics Service`: `/api/dashboard/*`
  - `Engine Service`: `/api/imports`, `/api/engine/*`
  - `Recon Service`: `/api/recon/*`
- **Authentication**: JWT-based authentication passed via Authorization headers (or HttpOnly cookies).

### 2.2. gRPC (Synchronous, Internal)
For high-performance, strongly-typed internal communication between microservices, gRPC is employed. This significantly reduces serialization latency compared to JSON/REST.
- **Implementation Pattern**: The `Analytics Service` heavily relies on gRPC to fetch raw or pre-aggregated metrics rapidly from the `Engine Service`.
- **Environment config**: e.g., `ENGINE_GRPC_HOST=engine`, `ENGINE_GRPC_PORT=50051`.

### 2.3. Event-Driven APIs / Message Queueing (Asynchronous, Internal)
Long-running and decoupled background processes utilize message queues and event streams, allowing API endpoints to return immediately (non-blocking) while work happens in the background.

#### A. Celery Task Queues (via Redis)
- **Use Case**: Scheduled jobs, report generation, and data transformations.
- **Workers**: Dedicated `engine_worker` containers consume tasks from Redis and process them.

#### B. Event Streaming (via Redpanda/Kafka)
- **Use Case**: High-throughput distributed events spanning multiple services.
- **Implementation**: Microservices produce and consume events to Kafka-compatible topics.
- **Example Topics**:
  - `engine.file_uploaded`: Emitted when a user uploads a new dataset.
  - `engine.data_processed`: Emitted when a background worker finishes parsing and validating a dataset.

### 2.4. Third-Party / AI APIs
- **Gemini API**: Integrated for advanced analytics, automated categorization, or text generation (managed via `GEMINI_API_KEY` in environment variables).

---

## 3. Data Flow Architecture

Understanding how data moves through the Enterprise Dashboard reveals how the microservices collaborate to fulfill complex user requests efficiently.

### 3.1. User Authentication & Authorization Flow
1. **Login Request**: User submits credentials via the Frontend login form.
2. **API Routing**: Request is sent to Traefik, which routes it to the `IAM Service` (`/api/auth/login`). Traefik applies rate limiting (e.g., 10 req/min) to prevent brute force attacks.
3. **Verification**: `IAM Service` queries the `ent_dash_iam` PostgreSQL database to verify credentials.
4. **Token Generation**: Upon success, a JWT (JSON Web Token) is generated and returned to the client.
5. **Subsequent Requests**: For any protected route, the Frontend attaches the JWT. The target microservice validates the JWT using the shared `SECRET_KEY` before fulfilling the request.

### 3.2. Large Data Import Flow (Asynchronous)
This is a critical flow ensuring the system remains responsive during heavy file processing.
1. **File Upload**: User uploads a CSV/Excel file via the Frontend.
2. **Gateway**: Traefik routes the request to the `Engine Service` (`/api/imports`).
3. **Object Storage**: `Engine Service` streams the file directly into **MinIO** (S3-compatible storage) to avoid loading massive files into RAM.
4. **Event Emission**: `Engine Service` acknowledges the upload to the user (returns `202 Accepted`) and publishes a message to **Redpanda (Kafka)** on the `engine.file_uploaded` topic, OR queues a task in **Celery via Redis**.
5. **Background Processing**:
   - The dedicated `Engine Worker` (Celery) picks up the task.
   - It downloads the file from MinIO in chunks.
   - It parses, validates, and transforms the data.
   - It bulk-inserts the clean data into the `ent_dash_engine` PostgreSQL database.
6. **Completion**: Upon success/failure, the worker emits a `engine.data_processed` event. The UI can poll for status updates or receive them via WebSockets/SSE.

### 3.3. Analytics Dashboard Data Flow (gRPC Integration)
1. **User Request**: User navigates to a dashboard; Frontend requests data from the `Analytics Service` (`/api/dashboard`).
2. **Internal Fetching**:
   - `Analytics Service` queries its own `ent_dash_analytics` DB for cached or localized metrics.
   - For real-time operational data, `Analytics Service` makes a high-speed **gRPC call** to the `Engine Service` (`engine:50051`).
3. **Aggregation**: `Analytics Service` merges the gRPC response with its own DB data, applying any required statistical models or Gemini AI insights.
4. **Response**: Aggregated JSON data is sent back to the Frontend to populate Recharts and UI components.

---

## 4. Database Architecture

The data tier is designed for strict isolation, scalability, and robust handling of varying data formats.

### 4.1. Database-Per-Service Pattern
To maintain microservice autonomy and prevent coupling, the system implements a **Database-Per-Service** pattern using PostgreSQL. While physically hosted on a single PostgreSQL 17 server (for infrastructure simplicity in local/staging), the databases are logically isolated:

- **`ent_dash_iam`**: Owned by IAM Service. Contains Users, Roles, Permissions, Organization Units, and Auth sessions.
- **`ent_dash_engine`**: Owned by Engine Service. Contains core business entities, imported datasets, and import job tracking.
- **`ent_dash_analytics`**: Owned by Analytics Service. Contains materialized views, aggregated reports, and dashboard layout configurations.
- **`ent_dash_recon`**: Owned by Recon Service. Contains reconciliation rules, matching states, and anomaly flags.

*Rule: Microservices cannot directly query another service's database. They must communicate via REST, gRPC, or Kafka events.*

### 4.2. PostgreSQL Configuration
- **Driver**: Utilizes `asyncpg` combined with SQLAlchemy 2.0 to enable non-blocking, asynchronous database I/O within the FastAPI event loop.
- **Migrations**: Schema versions are strictly controlled using **Alembic**. Each microservice repository contains its own `alembic` folder and `alembic.ini`.
- **Healthchecks**: Docker Compose enforces `pg_isready` healthchecks before allowing dependent microservices to boot, preventing startup crash loops.

### 4.3. Object Storage (MinIO)
Relational databases are inefficient for storing large binary files or raw import documents.
- **MinIO**: Acts as an S3-compatible object storage layer.
- **Usage**: The `ent-dash-imports` bucket stores raw CSV/Excel files uploaded by users. Background workers download these files for processing.

### 4.4. In-Memory Store & Caching (Redis)
- **Redis 7**: Provides ultra-fast, in-memory data structures.
- **Primary Use**: Acts as the broker (message queue) and result backend for Celery background workers.
- **Secondary Use**: Can be utilized by FastAPI for caching frequently accessed, slow-changing data (e.g., Role permissions).

---

## 5. Testing Strategy

Quality assurance and system stability are enforced through a multi-layered testing strategy covering both the Frontend and Backend microservices.

### 5.1. Backend Testing
The backend utilizes Python's standard testing ecosystems tailored for asynchronous microservices.

#### A. Unit & Integration Testing (Pytest)
- **Framework**: **Pytest** is the standard testing framework.
- **Structure**: Each microservice (e.g., `ent-dash-iam`, `ent-dash-engine`) maintains its own `tests/` directory.
- **Mocking**: External dependencies (like PostgreSQL, MinIO, or Redis) are mocked during unit tests to ensure fast execution. For integration tests, Testcontainers or an in-memory SQLite equivalent may be used.
- **Client**: FastAPI's `TestClient` (based on `httpx`) is used to simulate REST requests against the endpoints without starting a live server.

#### B. End-to-End & Infrastructure Testing
- **Scripted E2E**: Python scripts (e.g., `test_backend_services.py`) are used to execute live requests against the Traefik API Gateway.
- **Goal**: Verifies that Docker Compose networking is correct, Traefik routing rules are functioning (e.g., ensuring `/api/auth/login` maps to IAM), and services are successfully communicating with their respective PostgreSQL databases.

### 5.2. Frontend Testing
The Next.js frontend employs a robust testing stack focused on component behavior and user interaction.

#### A. Unit & Component Testing
- **Framework**: **Jest** paired with **React Testing Library**.
- **Coverage**: Tests focus on rendering behavior, state changes, and user event simulation (clicks, typing) on isolated `shadcn/ui` components and forms.
- **Mocking**: `next/router`, `SWR` hooks, and Axios API calls are mocked to isolate the UI logic from the backend.

#### B. Static Analysis
- **TypeScript**: Enforces strict typing to catch data structure mismatches at compile time.
- **ESLint & Prettier**: Automated linting ensures code quality, consistency, and adherence to React best practices.

### 5.3. CI/CD Integration (Future/Current)
- Automated testing workflows (e.g., GitHub Actions in `.github/workflows/ci.yml`) execute linting, frontend Jest tests, and backend Pytest suites on every pull request to prevent regressions before merging.
