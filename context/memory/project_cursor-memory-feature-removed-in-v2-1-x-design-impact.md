---
id: P-ESFSGXU2
type: project
shape: State
title: Cursor Memory Feature Removed in v2.1.x — Design Impact
created_at: 2026-07-03T21:05:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8e370b14072ea3dd87f54a2a83c14e455bb3dd1db505eead1600dae1f1e440b0
related: [cursor-adapter-lifecycle-hooks-for-deterministic-memory-inte, cursor-competitive-landscape-d-268, files-first-context-discovery-in-repo-versionable-memory]
---

Cursor's native Memories feature (introduced mid-2025) was removed in v2.1.x. Users were directed to convert memories into Rules instead. The native memory API is no longer available and docs 404.

**Impact on adapter:** No coexistence problem with built-in Cursor memory. Adapter focuses solely on its own memory injection via lifecycle hooks.

**Demand signal:** Cursor users lost native memory; demand for external memory systems (exactly what adapter provides) is now explicit.

**Why:** Architectural constraint for Task 196. Simplifies integration — no need to detect/avoid conflicts with Cursor's native memory layer. Explains user demand for the feature.

**How to apply:** In Task 196 code review, note that adapter uses only lifecycle hooks; no special handling needed for (non-existent) Cursor native memory. Validates the standalone memory injection approach.
