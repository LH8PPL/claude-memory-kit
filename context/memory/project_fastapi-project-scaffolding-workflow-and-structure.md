---
id: P-NYDA656J
type: project
title: FastAPI Project Scaffolding Workflow and Structure
created_at: 2026-06-11T14:35:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fe0da12970240f80fd755530e98d39b414cc0b6f
related: [e1-cold-open-test-persona-carries-unprompted, fastapi-layered-backend-scaffold-async-postgresql-sqlalchemy, live-test-workflow-for-kiro-cli-project-fix]
---

Standard structure and workflow established for FastAPI projects:

**Directory structure:**
- app/core/ — configuration (Pydantic Settings reading .env)
- app/api/v1/ — versioned routes (router.py aggregator, endpoint modules)
- app/schemas/ — Pydantic models for request/response validation
- tests/ — pytest suite with AsyncClient using ASGI transport

**Files created:**
- main.py — FastAPI app with asynccontextmanager lifespan
- pytest.ini — asyncio_mode = auto for async test discovery
- .env.example — configuration template

**Workflow:**
1. `uv init` project
2. Add production deps: fastapi, uvicorn[standard], pydantic-settings
3. Add dev deps: pytest, pytest-asyncio, httpx, ruff
4. Create packages and endpoints with full type hints
5. Configure ruff in pyproject.toml
6. Run `uv run ruff check --fix` to lint and fix
7. Run `uv run pytest` to verify

**Why:** Provides repeatable, testable scaffolding with proper layering (config/routes/schemas/tests separation), async-first design, and immediate verification

**How to apply:** Use this structure for new FastAPI projects; always include testing and linting from initialization before adding features
