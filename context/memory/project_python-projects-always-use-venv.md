---
id: P-X2EDL7XS
type: project
shape: Preference
title: Python Projects Always Use .venv
created_at: 2026-07-15T08:44:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0bc0658cc242e7192803bdfaefc844e56d791ef3b88a084b28055c91876747d2
related: [venv-setup-requirement, always-use-venv-for-python-package-installs, always-deploy-venv-and-install-all-pytho-x7esvwdl]
---

Standing rule (stated with "always"): deploy .venv, install all packages into it, run via venv interpreter—never system Python

**Why:** Isolates project dependencies, prevents cross-project conflicts

**How to apply:** For any Python project, `python -m venv .venv`, install via `.venv/Scripts/python.exe -m pip install -r requirements.txt`, run via `.venv/Scripts/python.exe app.py`
