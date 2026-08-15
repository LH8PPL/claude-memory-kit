---
id: P-RJH3aAP7
type: project
shape: Timeless
title: Tight Attribution in Learn-Loop Dampening
created_at: 2026-07-12T17:46:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: de1a20ac6da392b97decc985190b4db6f3e538f3682e3d56b92838cc035f1250
related: [vitest-pool-corruption-transient-load-failures, stress-gate-process-for-pr-merge, false-embedder-unavailable-alert-on-scope-decisions]
---

The learn-loop only dampens search ids the model actually invoked (via `mk_search`), not the entire injected snapshot. Failures unrelated to searched memory produce no dampen signal—this prevents false positives.

**Why:** A pytest error unrelated to memory recall shouldn't dampen a persona fact.

**How to apply:** When validating, expect no dampen signal if a command fails with zero in-chat searches. For a positive dampen, precede the failure with an in-chat `mk_search` that the failure then contradicts.
