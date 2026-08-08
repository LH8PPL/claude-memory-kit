---
id: P-MQ5RYUHQ
aliases: [P-MQ5RYUHQ]
type: project
shape: Timeless
title: Test-Suite Isolation Guard Required (Known Risk)
created_at: 2026-08-08T14:10:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cd91fda4093099110a2c4ebd08053d2da7dd9ff99280420ff453f906a181a253
related: [stress-gate-required-before-pr-for-spawn-hook-boundary-chang, vitest-pool-corruption-transient-load-failures, resume-fact-convention-capturing-uncommitted-code-intent]
---

- **Known risk**: Test-suite execution can write to the real memory corpus, corrupting production data.
- **Historical incident**: 177 files corrupted by test-suite writes (now restored, but guard not yet implemented).
- **Mitigation**: Structural guard required to isolate test-suite from production corpus.
- **Status**: Guard implementation is a blocking work gate before shipping.

**Why:** This is a real production risk that was encountered in a previous incident. Without the guard, future test runs could silently corrupt the corpus again.

**How to apply:** When implementing or reviewing test infrastructure, verify the structural guard exists. Never ship test-suite changes without isolation. Include guard verification in code review.
