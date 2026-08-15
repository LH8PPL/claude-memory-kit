---
id: P-5A4MDLD9
type: project
shape: Absence
title: v0.5.0 SessionEnd temporal-sweep memory leak (semantic mode)
created_at: 2026-07-07T14:46:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8b3a4874580564db2d9e60d106c530d96827d4cefae26f192826dcbf81f3a2dd
related: [v050-blocker-temporal-sweep-semantic-memory-leak]
---

**Symptom:** `cmk-compress-session.mjs` → `temporalSweep` freezes; RSS climbs to 5.5–8.8 GB.

**Cause:** Calls `prepareSemanticBackend()` per fact. Each call re-runs `syncSemanticIndex()`, loading 1455 fact bodies and batch-embedding ~471 uncached via ONNX (off-heap allocation, not subject to --max-old-space-size). Per-fact repetition unbounded.

**Fix:** Sync semantic index ONCE before per-fact loop; per-fact only embed query against synced vec table.

**How to implement:** TDD (fact-count budget-pair test + memory-bound assertion); verify with repro.

**Blocker:** Gate fires SessionEnd itself, so running it now re-triggers the freeze. Fix first, then proceed.

**Why:** Latent v0.5.0 code, gated by semantic mode. Per-fact cost was accepted in v0.4.5 assuming small fact counts.

**How to apply:** Create `task-fix-temporal-sweep-leak` branch; TDD; verify repro clean. Block gate/SessionEnd work until this lands.
