---
id: P-L5S6JJU3
type: project
title: v0.3.2 Release Scope Expanded
created_at: 2026-06-15T12:11:00Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 69515c4aa236d8342c4078f7c0bf67305bcc80c6db8ea0c17c1800b26d9e8f5d
related: [v0-3-2-scope-correction-dedup, v0-3-2-scope-locked-strict-task-order-discipline, task-141b-node-sqlite-migration-rejected-on-perf]
---

v0.3.2 final scope (expanded 2026-06-15): committed = Task 153 (FTS5 query sanitization for dots/version strings like v0.3), Task 152 (validate-index-completeness), Task 134 (Poison_Guard catalog extension, fixed-prefix providers), Task 154 (.gitattributes LF-pinning, the Task-139 CRLF follow-up), Task 147 (cmk digest + standing context/DECISIONS.md). Conditional = Task 141b (node:sqlite migration), gated on BOTH spikes passing: perf bake-off (node:sqlite p95 <= 1.03x better-sqlite3 on read/search paths) AND cross-platform sqlite-vec loadExtension under node:sqlite (Win/mac/Linux). If either spike fails, 141b defers and v0.3.2 ships without it.

**Why:** The v0.3.2 scope expanded beyond the initial 153+152 after re-evaluation: 134 (open since v0.3.1, zero-risk add) and the gitattributes follow-up (parked from Task 139) were pulled in, plus 147 (the decisions.md the user explicitly asked for). The node:sqlite migration stays conditional because search latency is paid every query forever — we don't sacrifice the kit's core purpose for an install-time convenience.

**How to apply:** Build 153/152/134/154/147 first (the committed scope). Run both 141b spikes to completion before any 141b code; log results in RELEASE-PLAN.md and gate accordingly. Keep v0.3.2 scope synced across tasks.md + RELEASE-PLAN.md.
