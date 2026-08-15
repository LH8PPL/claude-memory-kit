---
id: P-5PMG774Q
type: project
title: v0.4.4 Release Gate Checks
created_at: 2026-07-02T18:50:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9372378fb90bcf1f26b6a720875286aa80b4fdb063f758d49bb6a07130a06a6f
related: [release-gate-documentation-format-in-cut-gate-md]
---

The v0.4.4 gate includes five main checks (referenced in final verdict checklist as cut-blockers):
- **TV1–TV4** (Task 66: temporal-validity patch) — four deterministic checks:
  - TV1: `--shape` field validation (writes field, defaults to `State`, rejects invalid)
  - TV2: `--expires` and `expires_at` field handling (past-dated hides from search, resurfaces with `--include-expired`)
  - TV3: `cmk weekly-curate` tombstones past-expired facts (`deletedBy: expiry-sweep`), reports `expired_swept`, runs pre-cooldown
  - TV4: temporal-supersede window-close on real corpus; **no-false-SUPERSEDES** assertion (live-Haiku leg)
- **MC1** (Task 150: manual config check) — SessionStart injects commit proposal when `context/` is dirty; kit runs no git itself (ADR-0018)

Manual flags: live-Haiku temporal judge (TV4), auto-extract expiry suggestion, MC1 spoken relay

**Why:** v0.4.4 introduces temporal-validity and manual-config functionality. These gates verify the feature works and the release is safe. Some checks are deterministic and reproducible; others require live-Haiku judgment and manual verification. Recording which are manual prevents misunderstanding during the release.

**How to apply:** Before cutting v0.4.4, run TV1–TV4 locally (runnable probes documented in cut-gate.md), verify TV4's no-false-SUPERSEDES claim via live-Haiku, and manually verify MC1 spoken relay. All five must pass before the release is cut.
