---
id: P-LPR4WSKB
type: project
shape: Timeless
title: Gate Testing — Isolated Throwaway Folders
created_at: 2026-07-08T12:17:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 953fa86093d1bb47808b4c6aebc51aa41f6c9ee28f2d80da9661c1e823e7c1a9
related: [d-293-workaround-avoid-with-semantic-on-dev-repo-large-corpu, claude-memory-kit-installation-levels, cut-gate-sandbox-isolation]
---

Gate tests run in disposable folders (e.g., `C:\Temp\cut-gate22`), each initialized with `git init` + cmk installed locally. Dev repo is not used for gate testing itself; the refreshed global artifact is what gate folders consume.

**Why:** Isolates test environment from dev state (uncommitted changes, corpus size, prior installs); ensures reproducible results; avoids D-293 memory issues

**How to apply:** Fresh gate folder: `git init`, `cmk install --with-semantic`, run all gate prompts in that folder. Create a new gate folder per release cycle.
