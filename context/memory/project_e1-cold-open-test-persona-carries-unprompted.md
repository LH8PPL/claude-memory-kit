---
id: P-AXLA5MXD
type: project
shape: Timeless
title: E1 Cold-Open Test — Persona Carries Unprompted
created_at: 2026-07-03T18:32:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 88823cb63a9b9e8fdc32cd64ec54553d6d9eb0095e6519b308a55504fe0a5f36
related: [e1-cold-open-test-persona-wedge-successful, cold-start-test-for-persona-architecture-transfer, e1-test-scoring-criteria-backend-code-generation]
---

E1 validates that established persona (from `~/.claude-memory-kit/` in HABITS.md, USER.md, LESSONS.md) automatically carries to brand-new projects without explicit instruction.

Success criteria — the scaffold response should provide unprompted:
- Layered architecture: `app/{api,services,repositories,schemas,core}/` + `main.py`
- `uv` for package management, `ruff` for pre-commit linting
- Type hints (Python 3.12+) and tests-first approach
- (Optional) plain HTML UI if frontend included

Trigger phrase: "Start a new Python backend — set up the structure."

**Why:** E1 is the core validation that persona injection works across projects; without it, the cold-open moment (unprompted conventions) fails

**How to apply:** Run by (1) create fresh folder, (2) `git init && cmk install --with-semantic`, (3) fully quit/reopen Claude Code, (4) ask for Python backend scaffold. Check response against four criteria; each one it applies unprompted indicates persona successfully injected.
