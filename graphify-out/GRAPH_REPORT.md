# Graph Report - .  (2026-08-11)

## Corpus Check
- Large corpus: 530 files · ~156,756 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 2368 nodes · 4389 edges · 203 communities (167 shown, 36 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.54)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Engine Service & Import Tasks
- CRUD Base Layer
- Reconciliation Tests
- Feature List Schema
- Feature List Schema
- Feature List Schema
- Frontend Loading States
- Translation & i18n Service
- Feature List Schema
- Database Migrations
- Frontend Test Config
- Redis & Kafka Events
- Kafka Event Publisher
- API Dependencies & Auth
- Audit Logging
- QRIS Rekon Dashboard
- IAM Auth Routes
- File Import CRUD
- Admin IAM Pages
- Financial Repository
- Module Group 20
- Module Group 21
- Module Group 22
- Module Group 23
- Module Group 24
- Module Group 25
- Module Group 26
- Module Group 27
- Module Group 28
- Module Group 29
- Module Group 30
- Module Group 32
- Module Group 33
- Module Group 34
- Module Group 35
- Module Group 36
- Module Group 37
- Module Group 38
- Module Group 39
- Module Group 40
- Module Group 41
- Module Group 42
- Module Group 43
- Module Group 44
- Module Group 45
- Module Group 46
- Module Group 47
- Module Group 48
- Module Group 49
- Module Group 50
- Module Group 51
- Module Group 52
- Module Group 53
- Module Group 54
- Module Group 55
- Module Group 56
- Module Group 57
- Module Group 58
- Module Group 59
- Module Group 60
- Module Group 61
- Module Group 62
- Module Group 63
- Module Group 64
- Module Group 65
- Module Group 66
- Module Group 67
- Module Group 68
- Module Group 69
- Module Group 70
- Module Group 71
- Module Group 72
- Module Group 73
- Module Group 74
- Module Group 75
- Module Group 76
- Module Group 77
- Module Group 78
- Module Group 79
- Module Group 80
- Module Group 81
- Module Group 82
- Module Group 83
- Module Group 84
- Module Group 85
- Module Group 86
- Module Group 87
- Module Group 88
- Module Group 89
- Module Group 90
- Module Group 91
- Module Group 92
- Module Group 93
- Module Group 94
- Module Group 95
- Module Group 96
- Module Group 97
- Module Group 98
- Module Group 99
- Module Group 100
- Module Group 101
- Module Group 102
- Module Group 103
- Module Group 104
- Module Group 105
- Module Group 106
- Module Group 107
- Module Group 108
- Module Group 110
- Module Group 111
- Module Group 112
- Module Group 113
- Module Group 114
- Module Group 115
- Module Group 116
- Module Group 117
- Module Group 118
- Module Group 119
- Module Group 120
- Module Group 121
- Module Group 122
- Module Group 123
- Module Group 124
- Module Group 125
- Module Group 126
- Module Group 130
- Module Group 131
- Module Group 132
- Module Group 133
- Module Group 134
- Module Group 135
- Module Group 136
- Module Group 137
- Module Group 138
- Module Group 141
- Module Group 142
- Module Group 143
- Module Group 144
- Module Group 145
- Module Group 146
- Module Group 147
- Module Group 148
- Module Group 149
- Module Group 150
- Module Group 151
- Module Group 152
- Module Group 153
- Module Group 154
- Module Group 155
- Module Group 158
- Module Group 159
- Module Group 160
- Module Group 161
- Module Group 201

## God Nodes (most connected - your core abstractions)
1. `useTranslation()` - 60 edges
2. `api()` - 45 edges
3. `User` - 38 edges
4. `useAuth()` - 29 edges
5. `DataExplorerService` - 28 edges
6. `Skeleton()` - 26 edges
7. `cn()` - 26 edges
8. `ImportService` - 21 edges
9. `CRUDBase` - 19 edges
10. `RoleResponse` - 19 edges

## Surprising Connections (you probably didn't know these)
- `EngineService` --uses--> `UnauthorizedException`  [INFERRED]
  ent-dash-engine/app/grpc_server.py → ent-dash-analytics/app/core/exceptions.py
- `CRUDPermission` --uses--> `CRUDBase`  [INFERRED]
  ent-dash-iam/app/crud/crud_permission.py → ent-dash-engine/app/crud/base.py
- `CRUDRole` --uses--> `CRUDBase`  [INFERRED]
  ent-dash-iam/app/crud/crud_role.py → ent-dash-engine/app/crud/base.py
- `CRUDSystemConfig` --uses--> `CRUDBase`  [INFERRED]
  ent-dash-iam/app/crud/crud_system_config.py → ent-dash-engine/app/crud/base.py
- `CRUDTranslation` --uses--> `CRUDBase`  [INFERRED]
  ent-dash-iam/app/crud/crud_translation.py → ent-dash-engine/app/crud/base.py

## Import Cycles
- None detected.

## Communities (203 total, 36 thin omitted)

### Community 0 - "Engine Service & Import Tasks"
Cohesion: 0.06
Nodes (54): generate_service_token(), Generate a valid JWT M2M token for internal inter-service communication., Reset imports stuck in 'processing' status for longer than threshold_minutes.…, get_system_stats(), Any, AsyncSession, get, Aggregated stats for the superadmin dashboard (Data from IAM + Engine). (+46 more)

### Community 1 - "CRUD Base Layer"
Cohesion: 0.07
Nodes (43): CRUDBase, Any, AsyncSession, CreateSchemaType, ModelType, UpdateSchemaType, CRUD object with default methods to Create, Read, Update, Delete (CRUD).…, CRUDSystemConfig (+35 more)

### Community 2 - "Reconciliation Tests"
Cohesion: 0.07
Nodes (20): _build_test_app(), _make_aj_row(), _make_mock_db(), _make_onus_row(), _make_rintis_row(), FastAPI, Tests for Recon API routes (qa-006) Verifies: 1. /rekon/status endpoint 2.…, GET /rekon/status returns the expected service metadata. (+12 more)

### Community 3 - "Feature List Schema"
Cohesion: 0.05
Nodes (44): description, items, type, description, description, type, description, type (+36 more)

### Community 4 - "Feature List Schema"
Cohesion: 0.05
Nodes (44): description, items, type, description, description, type, description, type (+36 more)

### Community 5 - "Feature List Schema"
Cohesion: 0.05
Nodes (44): description, items, type, description, description, type, description, type (+36 more)

### Community 6 - "Frontend Loading States"
Cohesion: 0.07
Nodes (3): MetricCardSkeleton(), Skeleton(), SkeletonProps

### Community 7 - "Translation & i18n Service"
Cohesion: 0.07
Nodes (34): bulk_update_translations(), get_all_translations(), get_available_languages(), get_namespace_translations(), Any, AsyncSession, get, put (+26 more)

### Community 8 - "Feature List Schema"
Cohesion: 0.05
Nodes (44): description, items, type, description, description, type, description, type (+36 more)

### Community 9 - "Database Migrations"
Cohesion: 0.12
Nodes (28): do_run_migrations(), Connection, run_async_migrations(), run_migrations_online(), seed_initial_data(), main(), AsyncSession, Seed default system configuration values. Idempotent: inserts only keys that… (+20 more)

### Community 10 - "Frontend Test Config"
Cohesion: 0.05
Nodes (34): config, createJestConfig, compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx (+26 more)

### Community 11 - "Redis & Kafka Events"
Cohesion: 0.09
Nodes (32): close_redis(), init_redis(), Kafka Consumer — Listens for events from other microservices. Specifically…, Background loop that continuously polls Kafka for messages. Run this as an…, Trigger the consumer loop to exit gracefully., start_kafka_consumer(), stop_kafka_consumer(), setup_exception_handlers() (+24 more)

### Community 12 - "Kafka Event Publisher"
Cohesion: 0.07
Nodes (33): publish_event(), Any, Thin Kafka/Redpanda producer wrapper for microservice event publishing.…, Publish a JSON event to a Kafka/Redpanda topic. Args: bootstrap_servers: Comma-…, _bulk_insert(), _download_from_minio(), _get_session_for_table(), _get_table_columns() (+25 more)

### Community 13 - "API Dependencies & Auth"
Cohesion: 0.11
Nodes (27): get_current_user(), get_current_user_from_refresh_token(), get_current_user_payload(), AsyncSession, Request, User, Returns a dependency that checks if the current user has the required…, Decodes JWT and returns the payload claims as a dict. (+19 more)

### Community 14 - "Audit Logging"
Cohesion: 0.09
Nodes (30): AuditLogCreate, AuditLogResponse, Config, list_audit_logs(), log_activity(), Any, AsyncSession, BaseModel (+22 more)

### Community 15 - "QRIS Rekon Dashboard"
Cohesion: 0.08
Nodes (16): RekonQrisDashboard(), RekonQrisOnUsDashboard(), RekonQrisRintisDashboard(), AuthService, LoginResponse, RawLoginResponse, DashboardService, QrisStatsResponse (+8 more)

### Community 16 - "IAM Auth Routes"
Cohesion: 0.13
Nodes (28): health_check(), issue_sse_ticket(), login(), logout(), Any, AsyncSession, get, post (+20 more)

### Community 17 - "File Import CRUD"
Cohesion: 0.11
Nodes (19): CRUDFileImport, FileImportCreate, FileImportUpdate, AsyncSession, BaseModel, FileImport, Base, Tracks the lifecycle of a file import job. Owned by the Data Engine service.… (+11 more)

### Community 18 - "Admin IAM Pages"
Cohesion: 0.17
Nodes (23): OrgUnitsPage(), PositionsPage(), UsersPage(), DeleteConfirmationModalProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader() (+15 more)

### Community 19 - "Financial Repository"
Cohesion: 0.10
Nodes (19): FinancialRepository, Any, AsyncSession, FinancialIndicator, Financial Repository — Data Access Layer for ent-dash-analytics. Encapsulates…, Repository for all Financial Metric and Indicator queries., Returns the most recent distinct report dates., LEFT JOIN FinancialIndicator with FinancialMetric for the given dates.… (+11 more)

### Community 20 - "Module Group 20"
Cohesion: 0.16
Nodes (17): MOCK_OPERATIONS_DATA, OperationSummaryDashboard(), SettingsPage(), LoginPage(), FilterBar(), FilterBarProps, MetricCard(), MetricCardProps (+9 more)

### Community 21 - "Module Group 21"
Cohesion: 0.15
Nodes (24): override_get_db(), get_password_hash(), User, client(), AsyncClient, asyncio, fixture, test_get_audit_logs() (+16 more)

### Community 22 - "Module Group 22"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-next, jest, jest-environment-jsdom, tailwindcss, @testing-library/jest-dom, @testing-library/react (+19 more)

### Community 23 - "Module Group 23"
Cohesion: 0.22
Nodes (19): Structured logging setup for all Enterprise Dashboard services. Configures…, Configure the root logger for the service. Args: service_name: Used as a prefix…, setup_logging(), do_run_migrations(), Connection, run_async_migrations(), run_migrations_online(), Engine DB Initialization. Menggunakan `create_all` untuk memastikan tabel ada… (+11 more)

### Community 24 - "Module Group 24"
Cohesion: 0.15
Nodes (16): Dashboard(), DataTable(), DataTableProps, TableRow, TableRowProps, ChartCardProps, DPKBreakdownCharts(), DPKBreakdownChartsProps (+8 more)

### Community 25 - "Module Group 25"
Cohesion: 0.12
Nodes (15): ActivityTrackerProvider(), useAuth(), DashboardShell(), SidebarMenuDropdown(), SidebarMenuDropdownProps, SidebarNavItem(), SidebarNavItemProps, useSidebarNavigation() (+7 more)

### Community 26 - "Module Group 26"
Cohesion: 0.23
Nodes (22): RoleResponse, OrganizationUnitBase, OrganizationUnitCreate, OrganizationUnitResponse, OrganizationUnitTree, OrganizationUnitUpdate, PositionBase, PositionCreate (+14 more)

### Community 27 - "Module Group 27"
Cohesion: 0.08
Nodes (25): axios, dependencies, axios, @hookform/resolvers, next, @radix-ui/react-dropdown-menu, @radix-ui/react-slot, @radix-ui/react-tooltip (+17 more)

### Community 28 - "Module Group 28"
Cohesion: 0.16
Nodes (17): useRoleManagement(), RoleForm, RolesPage(), RoleFormProps, RoleTable(), RoleTableProps, RoleTableTranslations, DeleteConfirmationModal() (+9 more)

### Community 29 - "Module Group 29"
Cohesion: 0.20
Nodes (14): useQrisData(), MetricData, MetricsGrid(), MetricsGridProps, QrisDataTable(), QrisDataTableProps, QrisDataTableToolbar(), QrisDataTableToolbarProps (+6 more)

### Community 30 - "Module Group 30"
Cohesion: 0.14
Nodes (13): DataExplorerService, Any, AsyncSession, Create a new record in the specified table., Update an existing record by primary key., Delete a record by primary key., Get ORM model from whitelist, raise ValueError if not found., Get the first primary key column of a model. (+5 more)

### Community 32 - "Module Group 32"
Cohesion: 0.11
Nodes (6): MonitoringTab, TabId, TABS, Role, ProtectedRoute(), ProtectedRouteProps

### Community 33 - "Module Group 33"
Cohesion: 0.23
Nodes (19): CRUDPermission, Config, PermissionBase, PermissionCreate, PermissionResponse, PermissionUpdate, BaseModel, RoleBase (+11 more)

### Community 34 - "Module Group 34"
Cohesion: 0.10
Nodes (14): get_engine_stub(), Get the shared Engine gRPC stub. Raises if channel not initialized., Sync Service — Orchestrates gRPC-based data synchronisation from Engine to the…, get_engine_stub() must raise RuntimeError if channel not initialized., test_get_stub_raises_before_init(), EngineService, EngineServiceServicer, EngineServiceStub (+6 more)

### Community 35 - "Module Group 35"
Cohesion: 0.18
Nodes (20): cancel_import(), get_admin_import_summary(), get_import(), list_imports(), Any, AsyncSession, get, post (+12 more)

### Community 36 - "Module Group 36"
Cohesion: 0.09
Nodes (12): Tests for the Data Explorer CRUD service and API routes., Unit tests for DataExplorerService class., Verify that list_tables returns all 9 whitelisted tables., Verify each table entry has key, table_name, schema, display_name., Verify schema introspection returns column metadata., Verify each column has type, nullable, and primary_key info., Verify that requesting schema for an unknown table raises ValueError., Verify the whitelist blocks SQL injection attempts. (+4 more)

### Community 37 - "Module Group 37"
Cohesion: 0.16
Nodes (12): EditState, NAMESPACES, useTranslationEditor(), TranslationsPage(), TranslationsContext, TranslationsContextType, TranslationsProvider(), useTranslationsContext() (+4 more)

### Community 38 - "Module Group 38"
Cohesion: 0.16
Nodes (22): bulk_update_configs(), get_config(), list_configs(), Any, AsyncSession, get, post, put (+14 more)

### Community 39 - "Module Group 39"
Cohesion: 0.19
Nodes (15): BreadcrumbItem, Breadcrumbs(), DialogOverlay, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem (+7 more)

### Community 40 - "Module Group 40"
Cohesion: 0.11
Nodes (20): error_endpoint(), health(), homepage(), not_found(), Request, Unit tests for RequestLoggingMiddleware. Uses HTTPX + Starlette TestClient (via…, Log record must be valid JSON with required observability fields., Every response must have X-Request-ID header. (+12 more)

### Community 41 - "Module Group 41"
Cohesion: 0.14
Nodes (19): create_record(), delete_record(), get_table_schema(), list_available_tables(), list_records(), Any, AsyncSession, delete (+11 more)

### Community 42 - "Module Group 42"
Cohesion: 0.15
Nodes (13): metadata, RootPage(), AuthContext, AuthContextType, AuthProvider(), getRedirectPath(), User, UserInfoSubset (+5 more)

### Community 43 - "Module Group 43"
Cohesion: 0.15
Nodes (10): AdminDashboard(), formatDate(), statusConfig, StatCard(), StatCardProps, AdminSystemStats, fetcher(), RecentImport (+2 more)

### Community 44 - "Module Group 44"
Cohesion: 0.17
Nodes (14): DynamicEngineData, EngineHistoryTable(), EngineHistoryTableProps, ImportHistory, ImportConfigCard(), ImportConfigCardProps, Card, CardContent (+6 more)

### Community 45 - "Module Group 45"
Cohesion: 0.29
Nodes (14): UserFilterBarProps, UserFilterBarTranslations, PermissionFormProps, UserForm(), UserFormProps, OrganizationUnit, Permission, Position (+6 more)

### Community 46 - "Module Group 46"
Cohesion: 0.12
Nodes (12): UserFilterBar(), UserHeader(), UserHeaderProps, UserHeaderTranslations, UserActionButtonsProps, UserTable(), UserTableProps, UserTableTranslations (+4 more)

### Community 47 - "Module Group 47"
Cohesion: 0.20
Nodes (17): AuditLog, create_org_unit(), delete_org_unit(), Any, AsyncSession, delete, get, patch (+9 more)

### Community 48 - "Module Group 48"
Cohesion: 0.15
Nodes (13): FinancialService, Any, AsyncSession, Converts date objects to human-readable month-day labels., Orchestrates financial dashboard data retrieval and aggregation. Receives a DB…, Builds the financial dashboard payload: 1. Fetch recent report dates via…, Post-processes CASA metrics as a ratio of TOTAL_DPK., asyncio (+5 more)

### Community 49 - "Module Group 49"
Cohesion: 0.17
Nodes (11): AppException, ConflictException, ForbiddenException, NotFoundException, Any, Exception, Standardized exception hierarchy for all Enterprise Dashboard services. All…, Base exception — all service-level errors derive from this. (+3 more)

### Community 50 - "Module Group 50"
Cohesion: 0.20
Nodes (16): get_dynamic_engine_data_route(), get_engine_logs_route(), get_engine_stats_route(), Any, AsyncSession, get, Fetch raw data from dynamically specified engine tables., Fetch unified and formatted engine logs for frontend monitoring. (+8 more)

### Community 51 - "Module Group 51"
Cohesion: 0.18
Nodes (11): DynamicEngineData, ImportHistory, RekonEnginePage(), DynamicFormDialog(), DynamicFormDialogProps, PageHeader(), PageHeaderProps, ColumnSchema (+3 more)

### Community 52 - "Module Group 52"
Cohesion: 0.35
Nodes (17): create_permission(), create_role(), delete_permission(), delete_role(), get_permissions(), get_roles(), Any, AsyncSession (+9 more)

### Community 53 - "Module Group 53"
Cohesion: 0.20
Nodes (12): get_financial_dashboard(), Any, AsyncSession, get, get_daily_analysis(), Any, AsyncSession, get (+4 more)

### Community 54 - "Module Group 54"
Cohesion: 0.18
Nodes (11): PermissionTable(), PermissionTableProps, PermissionTableTranslations, DataTable(), DataTableColumn, DataTableProps, AuditLog, AuditService (+3 more)

### Community 55 - "Module Group 55"
Cohesion: 0.16
Nodes (11): EngineLogStats(), EngineLogStatsProps, StatCardProps, TIME_RANGES, TimeRangeLabel, QrisRow, TransactionsResponse, useDebounce() (+3 more)

### Community 56 - "Module Group 56"
Cohesion: 0.18
Nodes (13): GROUP_ICONS, groupKey(), groupLabel(), SystemConfigPage(), TYPE_BADGE_COLOR, TYPE_LABELS, BulkUpdateItem, ConfigValueType (+5 more)

### Community 57 - "Module Group 57"
Cohesion: 0.18
Nodes (11): DailyAnalysisResponseDto, BaseModel, QrisStatsResponseDto, QrisTransactionDto, QrisTransactionsResponseDto, AsyncSession, QrisService, QRIS Service — Business Logic Layer for AI-powered daily analysis. Implements… (+3 more)

### Community 58 - "Module Group 58"
Cohesion: 0.17
Nodes (11): get_tableau_embed_token(), BaseModel, get, post, Returns a JWT for Tableau Connected Apps embedding. Requires a valid Enterprise…, Triggers an extract refresh for a specific Tableau datasource. Typically called…, RefreshRequest, trigger_tableau_refresh() (+3 more)

### Community 59 - "Module Group 59"
Cohesion: 0.17
Nodes (11): _handle_event(), Any, Route events based on topic and payload., AsyncSession, FinancialIndicator, Fills in missing indicator metadata from gRPC row data., Returns the appropriate numeric value based on indicator type., Triggers and orchestrates metric synchronisation from Engine via gRPC. Fetches… (+3 more)

### Community 60 - "Module Group 60"
Cohesion: 0.19
Nodes (13): get_current_user_from_query(), Validates a short-lived SSE ticket (type='sse', TTL 60s) issued by POST…, get, Request, Server-Sent Events (SSE) endpoint for real-time notifications. Clients connect…, stream_notifications(), _build_redis_mock(), asyncio (+5 more)

### Community 61 - "Module Group 61"
Cohesion: 0.30
Nodes (13): verify_password(), User, Validate email+password and return the User if credentials are valid, or None…, _make_user_create(), asyncio, AsyncSession, Unit tests for CRUDUser. Covers: - create() hashes password (raw password !=…, test_create_hashes_password() (+5 more)

### Community 62 - "Module Group 62"
Cohesion: 0.18
Nodes (5): _ConfigService, Fetch all config rows from DB and populate the in-memory cache., Starts an asyncio background task that refreshes the cache every 5 minutes., Parse a comma-separated config value into a list of stripped strings., Directly update a single key in the cache (called after successful DB write).

### Community 63 - "Module Group 63"
Cohesion: 0.15
Nodes (11): args, escapeHtml(), evalPath, evalResult, harnessResult, output, renderBenchmarkHtml(), report (+3 more)

### Community 64 - "Module Group 64"
Cohesion: 0.15
Nodes (11): args, escapeHtml(), evalPath, evalResult, harnessResult, output, renderBenchmarkHtml(), report (+3 more)

### Community 65 - "Module Group 65"
Cohesion: 0.15
Nodes (11): args, escapeHtml(), evalPath, evalResult, harnessResult, output, renderBenchmarkHtml(), report (+3 more)

### Community 66 - "Module Group 66"
Cohesion: 0.15
Nodes (9): make_jwt_dependency(), Stateless JWT authentication middleware for microservices. Design principle: -…, Standalone JWT validator for use in gRPC, background tasks, etc., Factory function that returns a FastAPI dependency for JWT validation. Args:…, validate_jwt_token(), UnauthorizedException, get_db(), FactKinerjaResponse (+1 more)

### Community 67 - "Module Group 67"
Cohesion: 0.21
Nodes (11): calcMatchRate(), formatCurrency(), NetworkCard(), NetworkCardProps, NETWORKS, BadgeStatus, StatusBadge(), StatusBadgeProps (+3 more)

### Community 68 - "Module Group 68"
Cohesion: 0.34
Nodes (14): assign_user_roles(), create_new_user(), delete_user(), get_user(), list_users(), Any, AsyncSession, delete (+6 more)

### Community 69 - "Module Group 69"
Cohesion: 0.15
Nodes (11): args, escapeHtml(), evalPath, evalResult, harnessResult, output, renderBenchmarkHtml(), report (+3 more)

### Community 70 - "Module Group 70"
Cohesion: 0.29
Nodes (6): CRUDBase, Any, AsyncSession, CreateSchemaType, ModelType, UpdateSchemaType

### Community 71 - "Module Group 71"
Cohesion: 0.18
Nodes (6): EngineLogDetailModalProps, ActionCellProps, EngineLogTable(), EngineLogTableProps, LEVEL_STYLES, EngineLog

### Community 72 - "Module Group 72"
Cohesion: 0.24
Nodes (8): TableHeader(), TableHeaderProps, UserProfileProps, EN, ID, TranslationSchema, translations, TranslationsType

### Community 73 - "Module Group 73"
Cohesion: 0.18
Nodes (9): PermissionSearchBar(), PermissionSearchBarProps, GUARD_OPTIONS, RoleSearchBar(), RoleSearchBarProps, FormSearchableSelect(), FormSearchableSelectProps, SearchableSelectOption (+1 more)

### Community 74 - "Module Group 74"
Cohesion: 0.24
Nodes (7): Permission gate for Engine service endpoints. Since Engine is stateless (no…, require_engine_permission(), AppException, NotFoundException, Any, Exception, UnauthorizedException

### Community 75 - "Module Group 75"
Cohesion: 0.24
Nodes (9): HealthResponse, PaginatedMeta, PaginatedResponse, BaseModel, Standard API response schemas for all services. Ensures a consistent response…, Standard success wrapper for single-item responses., Standard success wrapper for paginated list responses., Health check response — used by all services at GET /health. (+1 more)

### Community 76 - "Module Group 76"
Cohesion: 0.24
Nodes (7): DetailRowProps, EngineLogDetailModal(), LEVEL_COLORS, LogConsoleProps, RoleForm(), useFocusTrap(), LogLevel

### Community 77 - "Module Group 77"
Cohesion: 0.27
Nodes (5): AppException, ForbiddenException, Any, Exception, ValidationException

### Community 78 - "Module Group 78"
Cohesion: 0.42
Nodes (4): CRUDUser, Any, AsyncSession, User

### Community 79 - "Module Group 79"
Cohesion: 0.36
Nodes (10): client(), override_get_current_user(), AsyncClient, asyncio, fixture, test_create_and_get_org_unit(), test_create_and_get_position(), test_org_unit_hierarchy() (+2 more)

### Community 80 - "Module Group 80"
Cohesion: 0.38
Nodes (8): setup_exception_handlers(), init_db(), Create all tables if they don't exist. Safe to call on every startup., EngineService, serve_grpc(), create_app(), lifespan(), FastAPI

### Community 81 - "Module Group 81"
Cohesion: 0.58
Nodes (6): SettingsContext, SettingsContextType, UISettings, Language, Size, Theme

### Community 82 - "Module Group 82"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, start, test (+1 more)

### Community 83 - "Module Group 83"
Cohesion: 0.33
Nodes (5): AppException, NotFoundException, Any, Exception, UnauthorizedException

### Community 84 - "Module Group 84"
Cohesion: 0.28
Nodes (6): BaseHTTPMiddleware, Request, Response, Structured JSON access log middleware. Per-request fields logged: - request_id…, Decode JWT from Authorization header without raising on failure., RequestLoggingMiddleware

### Community 85 - "Module Group 85"
Cohesion: 0.28
Nodes (6): BaseHTTPMiddleware, Request, Response, Structured JSON access log middleware. Per-request fields logged: - request_id…, Decode JWT from Authorization header without raising on failure., RequestLoggingMiddleware

### Community 86 - "Module Group 86"
Cohesion: 0.36
Nodes (4): PermissionForm(), PermissionList(), ListResponse, permissionApi

### Community 87 - "Module Group 87"
Cohesion: 0.25
Nodes (9): Any, AsyncSession, get, put, User, Get current authenticated user., Update current user UI settings., read_current_user() (+1 more)

### Community 88 - "Module Group 88"
Cohesion: 0.36
Nodes (6): setup_exception_handlers(), init_db(), create_app(), lifespan(), FastAPI, ConfigService — In-memory cache for database-backed system configuration.…

### Community 89 - "Module Group 89"
Cohesion: 0.28
Nodes (6): BaseHTTPMiddleware, Request, Response, Structured JSON access log middleware. Per-request fields logged: - request_id…, Decode JWT from Authorization header without raising on failure., RequestLoggingMiddleware

### Community 90 - "Module Group 90"
Cohesion: 0.42
Nodes (8): create_org_unit(), delete_org_unit(), get_org_unit_by_id(), get_org_unit_tree(), get_org_units(), AsyncSession, Fetches the organization unit hierarchy up to 5 levels deep., update_org_unit()

### Community 91 - "Module Group 91"
Cohesion: 0.36
Nodes (7): get_minio_client(), get_minio_presigned_url(), MinIO Client — Object Storage for large file uploads. Files uploaded by users…, Uploads raw bytes to MinIO and returns the object path (not a pre-signed URL).…, Generate a pre-signed download URL valid for `expires_hours` hours., upload_file_to_minio(), Minio

### Community 92 - "Module Group 92"
Cohesion: 0.39
Nodes (5): RekonEnginePage(), NetworkReconStats, useReconLogs(), useReconStats(), ReconStats

### Community 93 - "Module Group 93"
Cohesion: 0.29
Nodes (3): NavItemProps, SectionProps, SettingsNav()

### Community 94 - "Module Group 94"
Cohesion: 0.50
Nodes (4): CRUDRole, Any, AsyncSession, Role

### Community 95 - "Module Group 95"
Cohesion: 0.29
Nodes (6): args, force, initPath, replacements, results, target

### Community 96 - "Module Group 96"
Cohesion: 0.29
Nodes (6): args, force, initPath, replacements, results, target

### Community 97 - "Module Group 97"
Cohesion: 0.29
Nodes (6): args, force, initPath, replacements, results, target

### Community 99 - "Module Group 99"
Cohesion: 0.29
Nodes (3): BaseSettings, Sync psycopg2 URI for Celery worker to write to Recon DB., Settings

### Community 100 - "Module Group 100"
Cohesion: 0.38
Nodes (4): AnomalyAlert, ComplianceReport, ComplianceResponse, ComplianceService

### Community 101 - "Module Group 101"
Cohesion: 0.29
Nodes (6): ENGINE_OPTIONS, EngineLogFilters(), EngineLogFiltersProps, LOG_LEVEL_OPTIONS, MODULE_OPTIONS, SearchableSelect()

### Community 103 - "Module Group 103"
Cohesion: 0.38
Nodes (5): detectVariant(), ErrorVariant, PageError(), PageErrorProps, variantConfig

### Community 104 - "Module Group 104"
Cohesion: 0.29
Nodes (4): User, Retrieve all users with their related position, org unit, and roles., Create a new user, hashing the password before persisting., Update mutable user profile fields.

### Community 105 - "Module Group 105"
Cohesion: 0.29
Nodes (6): args, force, initPath, replacements, results, target

### Community 106 - "Module Group 106"
Cohesion: 0.47
Nodes (4): do_run_migrations(), Connection, run_async_migrations(), run_migrations_online()

### Community 107 - "Module Group 107"
Cohesion: 0.53
Nodes (5): Config, FinancialDashboardResponseDto, FinancialIndicatorDto, FinancialMetricDto, BaseModel

### Community 110 - "Module Group 110"
Cohesion: 0.40
Nodes (3): metadata, TableauEmbed(), TableauEmbedProps

### Community 111 - "Module Group 111"
Cohesion: 0.33
Nodes (3): BaseSettings, Parse comma-separated origins string into list., Settings

### Community 113 - "Module Group 113"
Cohesion: 0.40
Nodes (4): args, output, result, target

### Community 114 - "Module Group 114"
Cohesion: 0.40
Nodes (4): args, minScore, result, target

### Community 115 - "Module Group 115"
Cohesion: 0.40
Nodes (4): args, output, result, target

### Community 116 - "Module Group 116"
Cohesion: 0.40
Nodes (4): args, minScore, result, target

### Community 117 - "Module Group 117"
Cohesion: 0.40
Nodes (4): args, output, result, target

### Community 118 - "Module Group 118"
Cohesion: 0.40
Nodes (4): args, minScore, result, target

### Community 119 - "Module Group 119"
Cohesion: 0.40
Nodes (4): args, output, result, target

### Community 120 - "Module Group 120"
Cohesion: 0.40
Nodes (4): args, minScore, result, target

### Community 123 - "Module Group 123"
Cohesion: 0.50
Nodes (4): db_session(), AsyncSession, fixture, Yield a fresh AsyncSession backed by an in-memory SQLite DB. All tables are…

### Community 124 - "Module Group 124"
Cohesion: 0.67
Nodes (3): main(), AsyncSession, seed_data()

### Community 125 - "Module Group 125"
Cohesion: 0.50
Nodes (3): Tests for rec-001: Recon Matching Engine API Verifies: 1. Status endpoint…, Status endpoint must return expected format., test_recon_status_endpoint()

## Knowledge Gaps
- **390 isolated node(s):** `args`, `target`, `force`, `replacements`, `results` (+385 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **36 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_db()` connect `Module Group 66` to `Engine Service & Import Tasks`, `Reconciliation Tests`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `User` connect `Module Group 21` to `Database Migrations`, `API Dependencies & Auth`, `Audit Logging`, `Module Group 78`, `IAM Auth Routes`, `Module Group 79`, `Module Group 52`, `Module Group 26`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `FinancialService` connect `Module Group 48` to `Financial Repository`, `Module Group 53`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `User` (e.g. with `AuditLogCreate` and `AuditLogResponse`) actually correct?**
  _`User` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `DataExplorerService` (e.g. with `EngineJobEntryLog` and `EngineJobLog`) actually correct?**
  _`DataExplorerService` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `args`, `target`, `force` to the rest of the system?**
  _390 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engine Service & Import Tasks` be split into smaller, more focused modules?**
  _Cohesion score 0.05563093622795115 - nodes in this community are weakly interconnected._