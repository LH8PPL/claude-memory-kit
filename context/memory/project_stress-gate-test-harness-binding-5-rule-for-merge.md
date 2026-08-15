---
id: P-J37A3AY6
type: project
title: Stress Gate Test Harness — Binding 5× Rule for Merge
created_at: 2026-06-21T11:44:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 70ff3bf67568cbd7cfd3ca4028be882677d77fb7badce8439be1f7f1d942a173
related: [windows-eperm-spawn-concurrency-flake-class-and-fix-pattern, stress-flake-self-induced-load-not-regression, stress-gate-requirement-for-spawn-boundary-changes]
---

The merge-gate runs 5 consecutive full test suites back-to-back. Typical run ~13–14 min total (~150–175s per suite; 2132 tests, 130 files). This 5× repetition is intentional and binding—not a tuning knob.

**Why 5× is binding:** Flushes concurrency-class flakes (Windows handle-hold/EPERM, subprocess spawn contention) that only surface under load. Recent concrete example: pack-completeness flake (live-invariant test shells out to `npm pack` under 5× concurrency; transient spawn failure crashes vitest collection) and capture-turn teardown flake (final cleanup `rmSync` threw after 10 retries, defeating the retry loop when handle-hold outlasted 1.5s budget under load). Both were pre-existing, caught only by 5× stress, and had concrete Windows-EPERM causes.

**What makes the gate slow:**
- Live-Haiku spawn-smokes: suite spawns `claude --print` against real Haiku API for end-to-end proof; network-bound, not mocked
- Real subprocess spawns: `npm pack`, detached capture children, spawn-smoke kill-chain; Windows process startup cost is heavy, and 5× concurrency causes contention

**Iteration vs. merge-gate:**
- Fast iteration: `npm test` (single suite run, ~2.5 min)
- Merge-gate: 5× stress (required, ~13–14 min)

**Why:** The two pre-existing concurrency flakes prove why 5× is non-negotiable — they would have shipped without it.

**How to apply:** Expect ~13–14 min for stress runs. Do not attempt to skip 5× or remove live API calls for merge-gate. Iteration can use single `npm test` for speed, but the gate requires full stress to catch concurrency bugs before PR.
