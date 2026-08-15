---
id: P-MV3GBMZ2
type: project
title: FQ1 (FTS5 fix) in installed 0.3.2, ready for Session 2 recall tests
created_at: 2026-06-16T12:00:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a5ef9c0938fe9cf7616b76f592f966378d4536590bd55a11e46b38039ff12ae8
related: [post-215-merge-workflow-gate-continuation, mcp-server-may-retain-stale-code-in-memory-after-package-upd, rebuild-reinstall-before-session-2-release-cut-workflow]
---

FQ1 fix (FTS5 `prepareFtsQuery`) is confirmed present in installed 0.3.2 on disk. DJ2 idempotency fix affects digest path only (`decisions-journal.mjs`).

**Why:** Session 2 tests recall via `mk_search` (MCP server), which requires FQ1. Clarifies that rebuild is unnecessary for S2.

**How to apply:** Verify FQ1 presence by checking disk for `prepareFtsQuery` occurrences. Don't rebuild before Session 2 unless testing the digest path.
