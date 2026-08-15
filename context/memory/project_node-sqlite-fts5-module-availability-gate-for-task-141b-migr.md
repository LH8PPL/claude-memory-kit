---
id: P-YEH2DCQU
type: project
title: Node:sqlite FTS5 Module Availability Gate for Task 141b Migration
created_at: 2026-06-15T12:34:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 282816c80ea278fb99cf54e1cd68984adbf19acd63ad7fb35674703a21c93952
related: [npm-12-the-141a-141b-migration-strategy, v0-3-2-scope-correction-dedup, byte-preservation-as-hard-constraint-for-archive-splits]
---

When evaluating node:sqlite migration (Task 141b spike), FTS5 module availability across platforms is a required validation gate. `better-sqlite3` ships FTS5 compiled in by default; `node:sqlite` may not on all platforms. This constraint must be verified as part of the 141b spike work alongside perf bake-off and sqlite-vec loadExtension tests.

**Why:** Task 141b is conditional on three spikes. Without confirming FTS5 is available on all target platforms, the migration could pass in controlled dev/test environments but fail in production.

**How to apply:** Include FTS5 module availability as an explicit test/validation gate when scoping and executing the 141b spike work.
