---
id: P-B93GXMBD
type: project
title: v0.3.2 published to npm with provenance
created_at: 2026-06-16T14:04:57Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 053c473c0e887e2db2f1c8e1a228dca3c5940c0fcaed5a863318f8028798417c
related: [resume-v0-3-2-cut-gate-in-progress, v0-3-2-cut-gate-complete-e1-wedge-passed-ready-to-tag, task-156-decisions-md-recall-is-v0-3-3-the-next-version-firm]
---

v0.3.2 PUBLISHED 2026-06-16: @lh8ppl/claude-memory-kit@0.3.2 live on npm (SLSA provenance attestation present), GitHub Release v0.3.2 created. Scope = Task 153 (FTS5 query sanitization — the headline fix) + Task 152 (validate-index-completeness). Task 147 (cmk digest/DECISIONS.md) code merged but feature HELD for v0.3.3 (D-164). Full cut-gate ran, all gates green incl. E1 cold-open wedge live; the cut-gate caught+fixed 3 real bugs (DJ2 idempotency PR#194, js-yaml CVE PR#188, get-reads-tombstones doc bug). PUBLISH GOTCHA: the FIRST publish.yml run FAILED on a transient network ETIMEDOUT downloading onnxruntime-node's binary during `npm ci` (the optional semantic embedder pulls a large binary at install; shared CI runners occasionally time out) — NOT a code/release problem, nothing published (npm stayed 0.3.1). Fix: `gh run rerun <id> --failed` cleared it on retry. If it recurs, consider a retry/cache step for the onnxruntime-node install in publish.yml. NEXT = v0.3.3: Task 156 (DECISIONS.md AI-recall — make the journal recallable not write-only, the user's firm call) + Task 155 (cmk get --include-tombstoned recovery).

**Why:** Closes the v0.3.2 release loop — records what shipped, that the cut-gate caught 3 bugs, and the transient onnxruntime-node ETIMEDOUT publish failure + its retry fix (so a future cut doesn't panic when publish.yml fails on that dependency's network install).

**How to apply:** v0.3.2 is shipped. If a future publish.yml fails with onnxruntime-node ETIMEDOUT during npm ci, it's a transient network blip — `gh run rerun <id> --failed`, no code change needed; nothing publishes until the actual publish step, so retries are safe. Start v0.3.3 next: Task 156 + 155.
