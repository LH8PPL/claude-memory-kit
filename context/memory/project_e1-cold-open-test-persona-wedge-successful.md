---
id: P-F9ZaGH2V
type: project
shape: Event
title: E1 Cold-Open Test — Persona Wedge Successful
created_at: 2026-07-03T18:43:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ed9f32bb1b1ec1e48c5959cc2c8f36c98ff5e6e2812b27c2ccdc42e05cb3ccb9
related: [e1-cold-open-test-persona-carries-unprompted, three-session-release-validation-methodology, e1-test-scoring-criteria-backend-code-generation]
---

A brand-new git folder (created seconds before the session) was given a single prompt: "Start a new Python backend for me — set up the structure."

Without any restated preferences, the assistant:
- Fired `memory-search` and retrieved user-tier persona (uv, ruff, pytest, layered architecture, imperative commits)
- Scaffolded layered structure (`app/{api,services,models,schemas,core,db}` + `main.py`)
- Applied FastAPI, SQLite/async SQLAlchemy, Pydantic v2, full type hints, pytest with conftest
- Asked only genuinely open questions (framework, data layer) instead of guessing
- Captured the decision to project memory so future sessions won't re-ask

**Result: the persona injected unprompted into a cold project.** This is the wedge working.

**Why:** E1 validates that cross-project persona (stored in `~/.claude-memory-kit/`) persists across brand-new projects without repetition. This is the core promise the kit was built for.

**How to apply:** Future E-gate runs should watch for the same signals — unprompted application of uv/ruff/pytest/architecture, and memory-search firing without being asked. If any of these are missing, the persona tier is not injecting at SessionStart.
