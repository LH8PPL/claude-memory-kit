---
id: P-5BTBD4aX
type: project
title: FastAPI Layered Backend Scaffold (Async PostgreSQL, SQLAlchemy 2.0)
created_at: 2026-06-28T10:59:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e998e601c7837800840b525025311aab917a0d1623db4f8e3de367650db7b55e
related: [e1-cold-open-test-persona-wedge-successful, fastapi-project-scaffolding-workflow-and-structure]
---

- **Directory structure**: `app/` organized as `api/` (routes + dependencies), `services/` (business logic), `repositories/` (data access), `schemas/` (Pydantic boundaries), `models/` (SQLAlchemy ORM), `core/` (config + database)
- **Session lifecycle**: `get_session` dependency handles commit/rollback at request boundary; services/repos are transaction-agnostic; repositories use flush (not commit) to preserve scope while request-scoped transaction remains open
- **Error mapping**: Services raise domain exceptions (e.g. `ItemNotFoundError`); API layer catches and maps to HTTP status codes (404, etc.)
- **Dependency injection**: FastAPI dependencies typed with `Annotated` (e.g. `SessionDep`, `ItemServiceDep`)
- **Database**: SQLAlchemy 2.0 with asyncpg driver, `async_sessionmaker` with `expire_on_commit=False`
- **Testing**: pytest + pytest-asyncio; in-memory SQLite with shared connection (schema + data persist across request-scoped sessions); ASGI transport for `httpx.AsyncClient`; `dependency_overrides[get_session]` for isolation
- **Tech stack**: FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, asyncpg, Alembic, pytest, ruff, uv

**Why:** Validated scaffold matching user's recorded architecture preferences (thin routes → services → repos, Pydantic boundaries). Includes non-obvious patterns: flush-vs-commit in repos, expire_on_commit=False, shared SQLite fixture for request-scoped sessions in tests.

**How to apply:** Reference this when scaffolding a new FastAPI backend. Preserve directory structure and layered pattern; adapt Item/items example to new domain. Use especially for: async session lifecycle patterns, error mapping, and test harness isolation.
