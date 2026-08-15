---
id: P-SLVXFQEC
type: project
shape: Timeless
title: Proper Verb for Clearing Stale Locks
created_at: 2026-07-07T13:04:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5f403ebd5c4c9b2428f7835dbda33b6f17711f6f72319b7d3038dab7f1d7e035
related: [cmk-forget-as-safe-fact-removal-method, kit-delete-guardrail-false-positive-on-commit-messages, standard-cmk-installation-command]
---

Use `cmk repair --locks` to clear stale locks. The kit enforces a delete-guardrail that blocks raw `Remove-Item` attempts, making the repair verb the only safe path.

**Why:** The guardrail prevents accidental data loss and ensures consistency with kit-provided tooling.

**How to apply:** Always use `cmk repair --locks` in future sessions; never resort to raw filesystem deletions for lock cleanup.
