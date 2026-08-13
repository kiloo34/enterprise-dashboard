# Session Progress

## Completed Features (grf-001 to grf-007 — Graphify Findings)
- **[grf-001]** Consolidated `CRUDBase` to `ent-dash-common/ent_dash_common/crud.py`. Deleted both `ent-dash-engine/app/crud/base.py` and `ent-dash-iam/app/crud/base.py`. All 7 CRUD files updated to `from ent_dash_common.crud import CRUDBase`.
- **[grf-002]** Fixed 4 failing frontend test suites (AuthService, PageHeader, SettingsPages, AuthStateGuard). All 85/85 tests pass.
- **[grf-003]** Added `ent-dash-analytics/tests/test_financial_service.py` with 8 new test cases covering FinancialRepository, FinancialService, and QrisService.
- **[grf-004]** Created `ent-dash-common/ent_dash_common/db.py` with `make_session_factory()` and `make_get_db()`. All 4 service `session.py` files simplified to 3 lines each.
- **[grf-005]** Root cause of Engine↔IAM coupling (CRUDBase) resolved via grf-001. Remaining 13 edges to monitor; no code action needed.
- **[grf-006]** Created `.graphifyignore` to exclude `.agents/`, `.claude/`, `.codestudio/`, `skills/`, `graphify-out/` from graph scans.
- **[grf-007]** Evaluated ent-dash-engine split. Decision: **defer** — engine modules (ImportService, DataExplorerService) are cohesive enough for current team/scale. Split is recommended only if dedicated teams manage separate domains. See evaluation below.

### grf-007: ent-dash-engine Split Evaluation
**Current state:** 248 nodes, coupling ratio 28.22%, cohesion 0.056, 3 domains:
1. **Import Pipeline** — `ImportService`, `CRUDFileImport`, Celery tasks, MinIO/Kafka
2. **Data Explorer** — `DataExplorerService`, generic CRUD on whitelisted tables
3. **Core/Shared** — `CRUDBase` (now in common), exceptions, config, monitoring

**Recommendation: DEFER** — splitting into separate microservices adds operational overhead (3 Dockerfiles, 3 DB connections, 3 deploy pipelines) that is not justified at current scale. The 3 domains should remain in one service but be organized as separate Python sub-packages (`app/imports/`, `app/data_explorer/`) with clear internal boundaries. Revisit if team grows beyond 3 engineers on this service.

## Completed Features (prior sessions)
- **[tab-001]** Tableau Integration: Implemented JWT auth (`TableauService`) and embedded dashboards via `TableauEmbed.tsx`. Added automatic REST API token refresh in Celery tasks.
- **[qa-003]** Code Quality: Replaced all instances of `datetime.utcnow()` with timezone-aware `datetime.now(timezone.utc)` across the codebase.
- **[qa-004]** Code Quality: Replaced `print()` statements with structured logging `logger.error()` in `ent-dash-recon`.
- **[qa-005]** Code Quality: Fixed logger namespace in Analytics middleware from `iam.access` to `analytics.access`.
- **[qa-007]** Code Quality: Replaced hardcoded IAM URL in Engine with dynamic `settings.IAM_BASE_URL`.
- **[sec-007]** Security: Implemented per-endpoint rate-limiting using `slowapi` in IAM auth routes (`/login`, `/refresh`, `/sse-ticket`).
- **[fe-006]** Frontend: Generated `loading.tsx` and `error.tsx` boundaries for all 21 missing dashboard routes.
- **[qa-006]** Testing: Wrote comprehensive unit tests (`test_routes.py`) for Recon API endpoints (Stats, Transactions, Trigger).

## Current State
- `feature_list.json` has **0 TODOs remaining**.
- All modified Python syntax verified via `compileall`.
- Frontend TypeScript types validated via `npx tsc --noEmit`.

## Known Issues / Action Required
- **Recon Pytest Blocked**: Execution of `pytest` in the `ent-dash-recon` directory is currently blocked due to PEP-668 managed environment constraints. You must run the tests locally in your preferred environment:
  ```bash
  cd ent-dash-recon && python3 -m pytest tests/ -v
  ```

## Next Steps
- Review all completed backlog features.
- If everything looks good, run `./init.sh` to verify full system startup cleanly.
