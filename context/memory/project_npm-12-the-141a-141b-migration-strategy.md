---
id: P-4aG26CRV
type: project
title: npm 12 & the 141a/141b Migration Strategy
created_at: 2026-06-13T12:38:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a8ae8f5bb9a719dc5b6361fb5c486c21f0cd746c
related: [npm-v12-mitigation-plan-tasks-141a-141b, npm-v12-breaking-change-and-better-sqlite3-migration-plan, node-sqlite-fts5-module-availability-gate-for-task-141b-migr]
---

**The problem:** npm 12 (July 2026) turns install scripts off by default. better-sqlite3 uses binding.gyp → install script → silent failure → cmk crashes on first use.

**The 141a mitigation (shipped):** Install-time guard detecting broken binding, prompts user to fix.

**The 141b cure (slotted):** Migrate to node:sqlite (Node 22.5+, built-in, no native deps).

**Blockers for 141b:**
- API migration needed (all callers: index-db, search, semantic-backend, reindex)
- sqlite-vec extension cross-platform spike required
- Node floor bump to 22.5+ (user approved 2026-06-12)
- Verify node:sqlite is stable (not --experimental)

**Why:** npm-12 is a hard blocker for better-sqlite3. 141b removes the problem entirely; no native deps = install anywhere, forever.

**How to apply:** Spike sqlite-vec first; migrate APIs; bump Node floor and test cross-platform.
