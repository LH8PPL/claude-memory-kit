---
id: P-9PPTD9RE
type: project
title: Two-phase gate workflow pattern
created_at: 2026-06-25T08:46:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bd8994c308a919aaba0a196e0d9d60020f1aab87e653b6b6180450199a3af192
related: [pre-gate-rebuild-and-server-shutdown-sequence, cutgate-fresh-install-test-sequence, version-0-3-3-release-cut-gate16-test-session-state]
---

Gate work is split into **user pre-work** (rebuild global, kill servers, capture signal) and **assistant automation** (backup, fresh install, on-disk validation). Only the final live-chat part (driving the probes through the IDE) is manual user work. This keeps the gate reproducible and isolates what only the user can do (interact with their Kiro IDE).

**Why:** User system-specific actions (rebuild, local state) must be done by the user; assistant can automate the rest. Clear phase separation reduces gate failures from missed setup steps.

**How to apply:** After user pre-work, expect assistant to confirm "gate ready for live part" before starting the interactive probe runs.
