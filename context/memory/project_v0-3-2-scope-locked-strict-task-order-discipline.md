---
id: P-JXRTNTaG
type: project
title: v0.3.2 Scope Locked; Strict Task-Order Discipline
created_at: 2026-06-15T12:11:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e46a7238c5e58d1332dc5e590ca0dd2874dbd77709b82934c4a4446cf2a09524
related: [v0-3-2-release-scope-expanded, v0-3-2-scope-correction-dedup, v0-3-2-release-status]
---

**Scope (5 committed, 1 conditional):**
- 153: FTS5 query sanitization | S
- 154: .gitattributes LF-pinning | XS
- 152: validate-index-completeness | S
- 147: cmk digest + DECISIONS.md | S
- 134: Poison_Guard catalog extension | S
- 141b: node:sqlite migration | M | conditional on both spikes passing

**Execution order (strict):** 153 → 154 → 152 → 147 → 134, then run 141b spikes last to decide if 141b ships in v0.3.2 or defers.

**Why:** Dependencies and risk management. Spike results for 141b decide whether it ships in v0.3.2 or defers to v0.3.3.

**How to apply:** Next session working on this patch: follow this exact order. Refer to tasks.md and RELEASE-PLAN.md for task details. Do NOT reorder without explicit rationale.
