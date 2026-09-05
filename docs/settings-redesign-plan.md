# Settings Page Redesign Plan (v2 — DB-backed Translations)

## Top-Level Overview

**Goal:** Two independent but related workstreams:

1. **Settings UI Redesign** — Redesign the `/settings` area with a two-column panel layout (left nav + right content panel) inspired by the reference design, using the existing sub-pages as content.

2. **DB-backed Translation System** — Move all UI translation strings from static `.ts` locale files into the `system_configs` database table (IAM service), expose a public translation API, and add a *Translation Management* tab inside Settings where super-admins can view and edit any string per language — all without touching code or redeploying.

**Scope:**
- **Backend (IAM):** New `Translation` model + CRUD, new `/api/translations` endpoint (public GET, super-admin PUT), seeder for all existing strings
- **Frontend:** New `TranslationService` + `useTranslations` SWR hook replacing the static `translations.ts` mechanism; Settings redesign shell + nav; Translation Editor page in Settings
- **No changes** to existing sub-pages (`users/`, `roles/`, `permissions/`, `system-config/`)

**Architecture Decision — Why NOT SystemConfig for translations:**
The existing `system_configs` table is for technical runtime settings (CORS, token TTL, etc.) and is admin-only. Translations need: (1) a `language` dimension, (2) a `namespace` for grouping, (3) a public (no-auth) read endpoint since the login page also uses translations before auth. A dedicated `translations` table is the correct OOP separation.

---

## Part A — Backend: DB-backed Translation System

---

### Sub-Task A1 — `Translation` model & schema (IAM service)

**Intent:** Add a `Translation` SQLAlchemy model to the IAM service that stores each translatable string as a flat key, grouped by `namespace` (maps to existing groups: Common, Sidebar, Settings, etc.) and `language` (ID, EN, ...).

**Expected Outcomes:**
- `app.models.translation.Translation` class exists with fields: `id`, `namespace`, `key`, `language`, `value`, `is_editable`, `updated_by`, `updated_at`
- Pydantic schemas: `TranslationResponse`, `TranslationUpdate`, `TranslationBulkUpdate`
- Model registered in `init_db.py` imports so `create_all` creates the table
- Table: `app.translations`

**Todo List:**
1. Create `ent-dash-iam/app/models/translation.py` with SQLAlchemy `Translation` model (unique constraint on `namespace + key + language`)
2. Create `ent-dash-iam/app/schemas/translation.py` with Pydantic `TranslationResponse`, `TranslationUpdate`, `TranslationBulkUpdate` schemas
3. Add `from app.models.translation import Translation` import to `init_db.py`

**Relevant Context:**
- [`system_config.py` model](ent-dash-iam/app/models/system_config.py) — structural reference; follow same pattern
- [`init_db.py`](ent-dash-iam/app/db/init_db.py:10-16) — model import list

**Status:** [x] done

---

### Sub-Task A2 — `CRUDTranslation` class + seed all existing strings (IAM service)

**Intent:** Implement the repository class for translations and seed all existing static strings from `id.ts` and `en.ts` into the database, idempotently (never overwrites existing values, so admin edits are preserved across restarts).

**Expected Outcomes:**
- `CRUDTranslation` class with: `get_all_by_language(lang)`, `get_namespace(namespace, lang)`, `upsert(namespace, key, lang, value)`, `bulk_update(items)`, `get_all_as_nested_dict(lang)` → returns `{ namespace: { key: value } }` structure
- `seed_translations(db)` function in `seed.py` that seeds only the **Common, Sidebar, Settings, Users, Roles, Permissions** namespaces first (highest-priority strings, ~120 keys) — flat-keyed (e.g., `Common.add`, `Sidebar.dashboard`, `Settings.title`)
- `seed_translations` called from `init_db.py` (always runs, idempotent)
- Nested keys (like `Settings.themes.light.label`) stored with dot-notation key: `themes.light.label` in namespace `Settings`

**Todo List:**
1. Create `ent-dash-iam/app/crud/crud_translation.py` with `CRUDTranslation` class extending `CRUDBase`
2. Add `seed_translations(db)` function to `seed.py` — loop over ID/EN string values for namespaces `Common`, `Sidebar`, `Settings`, `Users`, `Roles`, `Permissions` and call upsert for each flat key path (e.g., namespace=`Common`, key=`add`, language=`ID`, value=`Tambah`)
3. Call `seed_translations` from `init_db.py`'s `seed_initial_data` (alongside `seed_system_configs`)

**Relevant Context:**
- [`crud_system_config.py`](ent-dash-iam/app/crud/crud_system_config.py) — `upsert` and `bulk_update` patterns
- [`seed.py`](ent-dash-iam/app/db/seed.py:273-360) — `seed_system_configs` is the idempotent pattern to follow
- [`id.ts`](ent-dash-fe/utils/locales/id.ts) + [`en.ts`](ent-dash-fe/utils/locales/en.ts) — source of all string values to seed

**Status:** [x] done

---

### Sub-Task A3 — `/api/translations` endpoint (IAM service)

**Intent:** Expose a public (no auth needed) GET endpoint to retrieve all translations for a given language, and a super-admin PUT endpoint to update individual strings. The public read enables the frontend (including the login page) to load translations before the user authenticates.

**Expected Outcomes:**
- `GET /api/translations?lang=ID` — returns `{ namespace: { "dot.key": value } }` for the specified language; **no auth required** (public)
- `GET /api/translations/{namespace}?lang=ID` — returns translations for a single namespace; **no auth required**
- `PUT /api/translations` — bulk update; requires super-admin role; body: `[ { namespace, key, language, value } ]`; returns updated records
- Router registered in `api_router` at prefix `/translations`

**Todo List:**
1. Create `ent-dash-iam/app/api/routes/translations.py` with the GET and PUT endpoints
2. Register the router in `ent-dash-iam/app/api/main.py`
3. The GET endpoint queries `CRUDTranslation.get_all_as_nested_dict(lang)` — no auth dependency
4. The PUT endpoint uses `get_current_user` + role check (`super-admin` only)

**Relevant Context:**
- [`system_config.py` route](ent-dash-iam/app/api/routes/system_config.py) — auth + role-check pattern
- [`api/main.py`](ent-dash-iam/app/api/main.py) — router registration

**Status:** [x] done

---

## Part B — Frontend: Translation System Overhaul

---

### Sub-Task B1 — `TranslationService` + `useTranslations` hook

**Intent:** Replace the static `translations.ts` / `id.ts` / `en.ts` import chain with a database-backed system. The frontend fetches translations once from the API on load and caches them with SWR. A static fallback (the existing locale files) is used if the API is unavailable, so the app never breaks during cold starts or network failures.

**Expected Outcomes:**
- `ent-dash-fe/services/TranslationService.ts` — `TranslationService` class with `fetchAll(lang)` → calls `GET /api/translations?lang={lang}`; returns the nested dict
- `ent-dash-fe/hooks/useTranslations.ts` — SWR hook that fetches the full translation dict for the current language; returns `{ data, isLoading }`
- `ent-dash-fe/utils/translations.ts` and locale files become **static fallback only** — files are **kept permanently as fallback** (deletion is a future decision outside this plan's scope); the system tries DB first, falls back to static on error
- `useTranslation` hook updated: reads from DB-fetched data if available, falls back to static `translations` object if DB data for that namespace/key is missing

**Todo List:**
1. Create `ent-dash-fe/services/TranslationService.ts` as a class with `static fetchAll(lang)` method
2. Create `ent-dash-fe/hooks/useTranslations.ts` — SWR hook keyed by `["/api/translations", language]`; stores result in a React context or Zustand-style atom accessible app-wide
3. Create `ent-dash-fe/components/TranslationsProvider.tsx` — wraps the app, fetches translations on mount/language-change, stores in React context
4. Modify `useTranslation.ts` hook: read from `TranslationsContext` first; fall back to static `translations[key][lang]` if not available
5. Add `TranslationsProvider` inside the existing provider tree in `ent-dash-fe/app/layout.tsx`

**Relevant Context:**
- [`useTranslation.ts`](ent-dash-fe/hooks/useTranslation.ts) — current static implementation to replace
- [`SettingsContext.tsx`](ent-dash-fe/components/SettingsContext.tsx) — context pattern to follow
- [`SWRProvider.tsx`](ent-dash-fe/components/SWRProvider.tsx) — SWR setup
- [`SystemConfigService.ts`](ent-dash-fe/services/SystemConfigService.ts) — service class pattern to follow

**Status:** [ ] pending

---

### Sub-Task B2 — Translation Editor UI (Settings page — super-admin only)

**Intent:** Add a "Terjemahan" (Translation) section inside the Settings left nav (Workspace group, visible only to super-admin) that renders a live editor where strings can be browsed by namespace, filtered by language, and edited inline — saving directly to the DB via the PUT API.

**Expected Outcomes:**
- New route `ent-dash-fe/app/(dashboard)/settings/translations/page.tsx`
- Left nav item "Terjemahan" visible only to super-admin users
- Page has: namespace dropdown/tabs (Common, Sidebar, Settings, Users, Roles, etc.), language toggle (ID / EN), and a table of `key | current value | edit input`
- Edit is inline — click edit icon, type new value, save → calls `PUT /api/translations`
- On save success: invalidates the SWR translation cache so the UI updates immediately without reload
- Uses existing `DataTable` or a similar table component from `components/ui`
- Loading/error states handled with `TableLoadingSkeleton` and `PageError`

**Todo List:**
1. Create `ent-dash-fe/app/(dashboard)/settings/translations/page.tsx`
2. Create `ent-dash-fe/app/(dashboard)/settings/translations/hooks/useTranslationEditor.ts` — manages namespace selection, language toggle, inline edit state, save action
3. Create `ent-dash-fe/services/TranslationService.ts` `bulkUpdate` method (add to existing service class)
4. Render a two-panel editor: left = namespace list, right = key-value table with inline edit
5. After save, call `mutate("/api/translations")` to refresh the SWR cache

**Relevant Context:**
- [`system-config/page.tsx`](ent-dash-fe/app/(dashboard)/settings/system-config/page.tsx) — exact UI pattern to follow for the inline-edit table
- [`SystemConfigService.ts`](ent-dash-fe/services/SystemConfigService.ts:52-63) — `bulkUpdate` + `mutate` pattern

**Status:** [x] done

---

## Part C — Settings UI Layout Redesign

---

### Sub-Task C1 — Create `SettingsNav` component

**Intent:** Build the left navigation panel for the Settings area with grouped sections: **Personal** (Appearance) and **Workspace** (Users, Roles, Permissions, System Config, Translations). Highlights the active route via `usePathname`. RBAC-gated items follow the same logic as `Sidebar`.

**Expected Outcomes:**
- `ent-dash-fe/app/(dashboard)/settings/components/SettingsNav.tsx` exists
- Two groups with section labels matching the reference design
- Each nav item: icon + label, `Link href`, active highlight (`bg-blue-50 dark:bg-blue-900/30 text-blue-600`)
- Workspace items conditionally shown by role (same permission checks as Sidebar)
- Translations item only shown to `super-admin`

**Todo List:**
1. Create `ent-dash-fe/app/(dashboard)/settings/components/SettingsNav.tsx`
2. Import `usePathname`, `Link`, `useAuth`, `useTranslation`, lucide icons
3. Derive `canManageAccess` and `isAdmin` from `useAuth()` (same logic as Sidebar hooks)
4. Render two groups: Personal (Appearance) and Workspace (Users, Roles, Permissions, System Config, Translations)
5. Active state: compare `pathname` to each item's `href`

**Relevant Context:**
- [`Sidebar.tsx`](ent-dash-fe/components/layout/Sidebar/Sidebar.tsx:55-64) — permission check and collapsed nav pattern
- [`SidebarNavItem`](ent-dash-fe/components/layout/Sidebar/components/SidebarNavItem.tsx) — active styling reference

**Status:** [x] done

---

### Sub-Task C2 — Create `settings/layout.tsx` shell

**Intent:** Wrap all `/settings/**` routes in a two-column layout: `SettingsNav` on the left (~220px), scrollable content on the right.

**Expected Outcomes:**
- `ent-dash-fe/app/(dashboard)/settings/layout.tsx` exists
- `flex flex-row` layout; left panel is `w-56 shrink-0`, right is `flex-1 min-w-0 overflow-y-auto`
- Mobile: `flex-col` (nav stacks above content)
- Left panel background uses `var(--card-bg)` with a right border `var(--card-border)` — consistent with sidebar aesthetic
- Left panel is sticky (`sticky top-0 h-screen overflow-y-auto`) so it doesn't scroll with content

**Todo List:**
1. Create `ent-dash-fe/app/(dashboard)/settings/layout.tsx`
2. Render `SettingsNav` on left, `{children}` on right in a `flex` wrapper
3. Apply responsive classes: `flex-col md:flex-row`
4. Style left panel border and background with CSS tokens

**Relevant Context:**
- [`DashboardShell.tsx`](ent-dash-fe/components/layout/DashboardShell.tsx) — two-column shell pattern

**Status:** [x] done

---

### Sub-Task C3 — Refactor `/settings/page.tsx` (Appearance tab)

**Intent:** The current Appearance page has an outer wrapper with `max-w-5xl` and `PageHeader`. Since the shell now provides the chrome, refactor it to match the reference design's row layout: label+description on left, controls on right per section.

**Expected Outcomes:**
- Page content root is a flat `<div className="p-6 lg:p-8">` — no `PageHeader`, no `max-w-5xl`
- Each section (theme, size, language) renders as a horizontal row: left column (~35%) with section title + description, right column (~65%) with the interactive controls
- Sections separated by `border-b border-[var(--card-border)]` dividers, matching reference style
- All existing theme/size/language selection logic (including `useSettings()` calls) completely preserved

**Todo List:**
1. Remove the outer `<div className="max-w-5xl mx-auto py-10 px-6">` and `<PageHeader>` from `page.tsx`
2. Add a page title header inside the content area (small section title, not `PageHeader`)
3. For each section: wrap in `<div className="flex flex-col md:flex-row gap-8 py-8 border-b">` with left label div and right controls div
4. Remove the `<footer>` from the page (it belongs in the shell or removed entirely)
5. Preserve all button onClick handlers and clsx active state styling

**Relevant Context:**
- [`settings/page.tsx`](ent-dash-fe/app/(dashboard)/settings/page.tsx) — current implementation
- Reference image: row layout per section, section label left, controls right

**Status:** [x] done

---

### Sub-Task C4 — Update translation strings for new nav labels

**Intent:** Add the 8 nav label keys to the translation system (using the new DB-backed approach — add them to the seed data).

**Expected Outcomes:**
- Seed data includes: `navPersonal`, `navWorkspace`, `navAppearance`, `navAccount`, `navUsers`, `navRoles`, `navPermissions`, `navSystemConfig`, `navTranslations` in namespace `Settings` for both ID and EN
- `TranslationSchema["Settings"]` type updated to include the new keys
- `id.ts` and `en.ts` static fallback files updated with the new keys

**Todo List:**
1. Add the 9 new keys to `TranslationSchema["Settings"]` in `types.ts`
2. Add values to `id.ts` and `en.ts` static fallback files
3. Add the 9 keys × 2 languages to the `seed_translations` seed data in `seed.py`

**Relevant Context:**
- [`types.ts`](ent-dash-fe/utils/locales/types.ts:110-137) — Settings interface
- [`id.ts`](ent-dash-fe/utils/locales/id.ts:112-139), [`en.ts`](ent-dash-fe/utils/locales/en.ts:112-138)

**Status:** [x] done

---

### Sub-Task C5 — Update Header page titles for settings routes

**Intent:** The Header derives page titles from pathname. Add missing cases for `/settings/permissions` and `/settings/translations`.

**Expected Outcomes:**
- `Header.tsx` shows the correct title for all settings sub-routes including translations
- No regressions for existing settings routes

**Todo List:**
1. In `Header.tsx`, add `pathname.includes("/settings/permissions")` → `tSidebar.managePermission`
2. Add `pathname.includes("/settings/translations")` → translation editor title string

**Relevant Context:**
- [`Header.tsx`](ent-dash-fe/components/layout/Header/Header.tsx:34-44) — pageTitle useMemo block

**Status:** [x] done

---

## Execution Order

```
A1 → A2 → A3   (backend — can be done in one session)
         ↓
B1              (frontend translation provider — depends on A3 endpoint being live)
         ↓
B2              (translation editor UI — depends on B1 and A3)
C4 → C1 → C2 → C3 → C5   (UI redesign — C4 can run in parallel with B1)
```

Backend (A1-A3) must be implemented before frontend translation provider (B1), but the UI redesign (Part C) can be worked on in parallel since it doesn't depend on the translation API being live — it uses the existing static fallback.

---

## Validation

After all sub-tasks:
- `GET /api/translations?lang=ID` returns the full translation dict
- Super-admin can edit a string in Settings → Terjemahan and it immediately reflects in the UI
- All settings routes render with the two-column shell
- Existing user/role/permission/system-config pages remain fully functional
- TypeScript compiles with no new errors
- Static fallback still works if the backend is unreachable
