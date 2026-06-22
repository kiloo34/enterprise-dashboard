# AGENTS.md

Project harness for reliable agent-assisted development in a python codebase.

## Startup Workflow

Before writing code:

1. **Confirm working directory** with `pwd`
2. **Read this file** completely
3. **Read project docs if present** (`docs/ARCHITECTURE.md`, `docs/PRODUCT.md`, README, or equivalent)
4. **Run `./init.sh`** to verify environment is healthy
5. **Read `feature_list.json`** to see current feature state
6. **Review recent commits** with `git log --oneline -5`

If baseline verification is failing, repair that first before adding new scope.

## Working Rules

- **One feature at a time**: Pick exactly one unfinished feature from `feature_list.json`
- **Verification required**: Don't claim done without running verification commands
- **Update artifacts**: Before ending session, update `progress.md` and `feature_list.json`
- **Stay in scope**: Don't modify files unrelated to the current feature
- **Leave clean state**: Next session must be able to run `./init.sh` immediately

## Architecture & Coding Rules

- **Frontend Templating**: Frontend MUST strictly use the established UI templating system (e.g., shadcn/ui components in `components/ui`). Do not write raw custom HTML/CSS layouts.
- **No Static Code**: Avoid hardcoded static data or static HTML. All data, states, and layouts must be dynamic and API-driven.
- **Backend OOP**: Backend services must strictly follow Object-Oriented Programming (OOP) concepts. Encapsulate business logic within class-based Services, Repositories, or Managers rather than using loose procedural functions.

## Code Quality Principles

These principles apply to ALL code written in this project, backend and frontend alike. An agent must self-check against this list before marking any feature as done.

### Object-Oriented Programming (OOP)

- **Backend**: Every piece of business logic lives inside a class — `Service`, `Repository`, `Manager`, `Controller`, or domain `Entity`/`ValueObject`. No loose top-level functions for business rules; utility/helper functions are only acceptable for pure, stateless, generic operations (e.g., string formatting, math helpers).
- **Encapsulation**: Internal state is private/protected where the language allows it. Expose behavior through methods, not raw attribute access.
- **Composition over inheritance**: Prefer composing small classes/interfaces over deep inheritance trees. Use inheritance only for genuine "is-a" relationships, not to share code.
- **Frontend**: Encapsulate component logic into well-defined units (component classes/hooks/services). Shared logic belongs in reusable hooks/services, not copy-pasted across components.

### DRY (Don't Repeat Yourself)

- If the same logic appears more than twice, extract it into a shared function, method, class, hook, or component.
- Shared constants, types/interfaces, and validation rules must be defined once and imported, never redefined per file.
- Backend: shared query logic belongs in a Repository; shared business rules belong in a Service — not duplicated across endpoints/controllers.
- Frontend: shared UI patterns belong in a reusable component from `components/ui` (or a composed wrapper around it) — not re-implemented per page.

### KISS (Keep It Simple, Stupid)

- Prefer the simplest design that correctly satisfies the requirement. Don't add abstraction, configuration, or flexibility for hypothetical future needs ("YAGNI" applies alongside KISS).
- Functions/methods should do one thing. If a method needs a comment to explain "what" it does (not "why"), it's a candidate for splitting or renaming.
- Avoid clever one-liners or deep nesting that sacrifice readability for brevity.

### Modularity & Abstraction

- **Separation of concerns**: Backend layers — routing/controllers, services (business logic), repositories (data access), and models/schemas — must stay separate. A controller should not contain SQL or business rules; a service should not know about HTTP request/response objects.
- **Dependency direction**: Higher-level modules depend on abstractions (interfaces/abstract base classes), not on concrete low-level implementations, so implementations can be swapped (e.g., swapping a database or external API client) without rewriting business logic.
- **Frontend modularity**: Each component has a single responsibility. Page-level components compose smaller, reusable components rather than containing large inline logic blocks. API calls go through a dedicated service/client layer, not scattered `fetch` calls inside components.
- **Small, focused files**: If a file/class/component is doing too much, split it along its responsibilities rather than letting it grow indefinitely.

### Self-Check Before Marking a Feature Done

In addition to the existing Definition of Done, confirm:

- [ ] No duplicated logic was introduced (DRY)
- [ ] No unnecessary complexity or premature abstraction was introduced (KISS)
- [ ] Backend logic is class-based and properly layered (Controller / Service / Repository / Model)
- [ ] Frontend logic uses existing UI templating system and reusable components; no raw static HTML/CSS or hardcoded data
- [ ] New shared logic was abstracted into a single reusable location, not copy-pasted

## Harness Engineering Principles

This project is built and operated as an **agent harness**, not just a codebase. The harness itself (this file, `init.sh`, `feature_list.json`, `progress.md`) must stay robust enough that any agent — with no prior session memory — can pick it up safely. These principles govern the harness, separate from the Code Quality Principles above which govern the application code.

### Idempotency

- `./init.sh` must be safely runnable any number of times in a row without side effects that break the environment (e.g., re-running `docker compose up -d --build` should converge to the same healthy state, not duplicate containers or corrupt data).
- Setup/migration steps must check current state before acting (e.g., "create table if not exists", not "create table").
- Re-running verification must never be destructive. If a step has side effects (seeding data, sending requests), it must be guarded or mocked.

### Observability

- Every verification step in `init.sh` must produce visible, unambiguous output: what ran, and pass/fail — not just a silent exit code.
- Failures must surface the actual error (stdout/stderr from the failing command), not be swallowed or summarized away.
- `progress.md` must contain enough detail that a new session can reconstruct *what was tried*, *what worked*, and *what failed* without re-deriving it from git log alone.

### Guardrails

- The agent must not bypass verification to "save time" — a feature is never marked done without the required checks actually running (see Definition of Done).
- The agent must not silently expand scope. If fixing one feature reveals the need to touch unrelated files, that gets flagged in `progress.md`/`session-handoff.md`, not done silently.
- Destructive operations (drop table, force-push, `rm -rf`, overwriting data volumes) require explicit user confirmation — never run automatically as part of routine verification.
- Secrets/credentials are never hardcoded, logged, or committed — read from environment/`.env` and excluded via `.gitignore`.

### Restartability / Determinism

- The repository must always be left in a state where `./init.sh` succeeds from a cold start (fresh clone, fresh containers). This is the harness's core contract.
- Verification must be deterministic: the same code, run twice, produces the same pass/fail result. Flaky tests are a bug in the harness, not something to route around.
- Environment state (containers, dependencies, migrations) must be fully described in version-controlled files (`docker-compose.yml`, `requirements.txt`/`pyproject.toml`, migration scripts) — never depend on undocumented local machine state.

### Scoped Autonomy

- The agent operates with full autonomy *within* one feature's scope, but escalates to the user at defined boundaries: architecture decisions, unclear requirements, repeated failures (see Escalation section).
- Autonomy is bounded by verification, not trust: the agent can make changes freely as long as `./init.sh` is the final arbiter of whether those changes are acceptable.

### Fail-Safe Defaults

- If a verification step's outcome is ambiguous (e.g., a test framework not yet configured), default to flagging it for human review rather than assuming success.
- If `init.sh` itself fails, that is always priority #1 — no new feature work begins until the harness is healthy again.

### Self-Check: Harness Health

Before ending any session, confirm:

- [ ] `./init.sh` runs clean from the current repo state with no manual intervention
- [ ] No verification step was skipped, mocked away, or silently ignored
- [ ] Any destructive/irreversible action taken was explicitly confirmed by the user beforehand
- [ ] `progress.md` and `feature_list.json` accurately reflect reality, not aspiration

## Required Artifacts

- `feature_list.json` — Feature state tracker (source of truth)
- `progress.md` — Session continuity log
- `init.sh` — Standard startup and verification path
- `session-handoff.md` — Optional, for larger sessions

## Definition of Done

A feature is done only when ALL of the following are true:

- [ ] Target behavior is implemented
- [ ] Required verification actually ran (tests / lint / type-check)
- [ ] Evidence recorded in `feature_list.json` or `progress.md`
- [ ] Repository remains restartable from standard startup path
- [ ] Code follows the Code Quality Principles above (OOP, DRY, KISS, modularity, abstraction)
- [ ] No harness guardrail was bypassed (see Harness Engineering Principles)

## End of Session

Before ending a session:

1. Update `progress.md` with current state
2. Update `feature_list.json` with new feature status
3. Record any unresolved risks or blockers
4. Commit with descriptive message once work is in safe state
5. Leave repo clean enough for next session to run `./init.sh` immediately

## Verification Commands

```bash
# Full verification (recommended)
./init.sh
```

Required checks:
- `python -m pytest`
- `python -m compileall .`

## Escalation

If you encounter:
- **Architecture decisions**: Consult project architecture docs if present, otherwise ask user
- **Unclear requirements**: Check product/requirements docs if present, otherwise ask user
- **Repeated test failures**: Update progress, flag for human review
- **Scope ambiguity**: Re-read `feature_list.json` for definition of done
