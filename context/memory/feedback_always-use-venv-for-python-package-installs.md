---
id: P-WQAPLaAA
type: feedback
shape: Preference
title: Always use .venv for Python package installs
created_at: 2026-07-09T10:48:39Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9b7fe7866ec9ba9bbf0dc6a9432512d2efee9c0906ae99a500ebc79dde6d553c
related: [venv-setup-requirement, python-projects-always-use-venv, global-binary-lag-after-code-merge]
---

Create and use a `.venv` virtual environment in the project root for all Python projects. Install all Python packages into it, never into the global Python environment.

**Why:** User wants Python dependencies isolated to a local `.venv` so installs are reproducible and don't pollute the system Python.

**How to apply:** Before installing any Python package, run `python -m venv .venv`. Always install via `.venv\\Scripts\\pip` (Windows) or `.venv/bin/pip` (Unix). Ensure `.venv/` is in `.gitignore`.
