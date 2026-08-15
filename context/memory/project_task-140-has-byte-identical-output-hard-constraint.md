---
id: P-BQDDQLMM
type: project
title: Task 140 has byte-identical output hard constraint
created_at: 2026-06-13T09:46:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 84a04045d22fecd99e1f8b0f23908da680e0e68e
related: [byte-preservation-as-hard-constraint-for-archive-splits, use-deterministic-comparators-for-sorting-committed-files]
---

Task 140 canonicalizes loop-based trailing-strip operations.
Output MUST be byte-identical (hard constraint).
This is critical because output feeds content-addressed ID generation downstream.

**Why:** Any byte difference breaks downstream content-addressed systems

**How to apply:** When implementing Task 140, use byte-exact verification; do not relax this constraint
