---
id: P-PSN32KXM
type: project
title: E1 Test Scoring Criteria (Backend Code Generation)
created_at: 2026-06-11T14:10:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1ce98fa7b1e2d07d536fcd080ff891f1b5b711c6
related: [e1-cold-open-test-persona-carries-unprompted, e1-cold-open-test-persona-wedge-successful, three-session-release-validation-methodology]
---

E1 measures whether memory affects **how code is built** (architecture, tooling, patterns), not **what** is built (product choice). Score as **PASS** if the cold-open scaffold unprompted includes:
- `uv` for dependency management (not pip)
- `.venv` folder creation
- Type hints on all function signatures (Python 3.12+ style)
- Tests-first approach with dedicated tests folder
- Layered architecture split: api / services / repositories / schemas
- `ruff` linting executed before any assistant-committed code

Absence of these signals → **FAIL** (memory did not influence code generation style).

**Why:** E1 validates that memory successfully embedded the user's backend philosophy (FastAPI, type safety, testing discipline) into code generation without explicit prompting. This is the core efficacy test.

**How to apply:** In future cold-opens, evaluate the assistant's first scaffold against this checklist. 5+ criteria present unprompted = memory working.
