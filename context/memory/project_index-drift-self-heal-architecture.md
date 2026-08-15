---
id: P-7G3GYKTM
type: project
title: INDEX Drift Self-Heal Architecture
created_at: 2026-06-14T08:28:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 251239537c5f6d514fd67f741810fc1558d33c2142a65f8dc329635e3a6b53b1
related: [anti-pattern-rejection-sessionstart-auto-heal, version-snapshot-in-recent-md-guards-against-cross-session-a, hc-9-drift-after-claude-code-update-v0-3-4]
---

INDEX can lag behind actual memory files (cosmetic; doesn't break recall). On next capture, `reindex()` rebuilds INDEX wholesale from all files on disk, healing the drift incidentally.

**Current state:** Works but undocumented; no test guarantees it.

**Decision:** Pin with a test to make this behavior contractual. Do not add SessionStart auto-heal machinery (would add I/O to the hot path for a cosmetic issue).

**Related healing:** HC-4 detects drift; search DB auto-heals separately.

**Why:** The incidental next-capture self-heal is sufficient and costs nothing at runtime. SessionStart machinery would over-engineer a vanishingly rare edge case.

**How to apply:** Write a test validating INDEX rebuilds on next capture after drift. Do not add SessionStart scanning.
