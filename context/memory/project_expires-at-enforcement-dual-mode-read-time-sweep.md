---
id: P-FCB2THCC
type: project
title: Expires_at Enforcement — Dual-Mode (Read-Time + Sweep)
created_at: 2026-07-02T11:40:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6e4eec0895a8933a679841e5ea3df768e33f9db0c75263692db24950672e6788
related: [expiry-mechanism-precedents-anti-patterns]
---

Enforcement happens in two places:
- Read-time filter: Search hides expired facts on both keyword and semantic paths by default; `--include-expired` flag available for human-only reveal (same posture as tombstones).
- Weekly sweep: `expiry-sweep.mjs` runs in weekly-curate's pre-cooldown slot, tombstones expired facts through `forget()` (audited, recoverable, never hard-deleted).
This dual approach matches mem0 and graphiti precedents — read-time immediate, sweep eventual. Avoids the LangGraph trap (no configured sweep = nothing expires).

**Why:** Enforcing at read-time + sweep ensures expiry is immediate (user perception) and eventual (database hygiene). Tombstone instead of hard-delete maintains audit trail per D-163.

**How to apply:** Future expiry work touches write-side surfaces (`expires_at` params) and read paths (check `hidden_at` before returning facts).
