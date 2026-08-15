---
id: P-KYTE5Q9V
type: project
title: .venv Setup Requirement
created_at: 2026-06-19T20:45:55Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 27988adfe17672263e1d17931beb515c48c5f733420f65a2181f496cf15e1627
related: [always-use-venv-for-python-package-installs, python-projects-always-use-venv, always-use-uv-for-python-packages-in-thi-gb6hwr94]
---

Always create .venv in project root before installing Python packages. Use venv interpreter for all subsequent python/pip commands. (.venv already covered by .gitignore.)

**Why:** Isolates dependencies; prevents version conflicts across projects.

**How to apply:** Start Python projects: `python -m venv .venv && .venv/Scripts/python.exe -m pip install ...` (Windows); adjust for platform.
