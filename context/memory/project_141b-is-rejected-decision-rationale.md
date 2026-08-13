---
id: P-WB2VQPWN
type: project
title: 141b Is Rejected — Decision Rationale
created_at: 2026-06-16T04:42:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 19c8a921645825dd89ff52a01ba98005c92d667bfb05f6e7c217b1f42b97a791
related: [task-141b-node-sqlite-migration-rejected-in-d-162, node-sqlite-migration-decision, task-141b-node-sqlite-migration-rejected-on-perf]
---

- **What:** Migration from better-sqlite3 to node:sqlite for FTS5 is REJECTED.
- **Why rejected:** node:sqlite is ~10% slower on FTS5 keyword search (measured on CI with ±0.8% noise vs ±8–22% on laptop).
- **Bar:** Per D-147, must not regress perf.
- **Outcome:** better-sqlite3 stays; v0.3.2 does not include 141b.

**Why:** Decision grounded in clean, repeatable CI data. User's persistent questioning of noisy laptop results led to escalating to CI, which provided the definitive answer.

**How to apply:** If future discussions revisit node:sqlite, reference the ±10% FTS5 regression as the documented blocker. Don't re-litigate without new data.
