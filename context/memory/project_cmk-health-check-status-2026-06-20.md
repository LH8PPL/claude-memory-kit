---
id: P-2RaREHLR
type: project
title: CMK Health Check Status (2026-06-20)
created_at: 2026-06-20T07:50:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f48fbade0e7d982007b0aed516dbd9213af6cfdc8898a6ef3b26858746bbdf38
related: [cascade-starvation-lazy-distill-limitation-on-busy-repos, claude-memory-kit-health-check-suite-hc-1-through-hc-9, cron-job-registration-feature-hc-5]
---

- [PASS] Stop + SessionStart hooks registered
- [PASS] Transcripts firing (4 within 3 days)
- [PASS] INDEX.md matches memory/ files (454 facts in sync)
- [PASS] Native Anthropic auto-memory ACTIVE (runs alongside kit)
- [FAIL] Daily distill stale — recent.md 4 days old (cutoff: 2 days)
- [SKIP] Cron jobs NOT registered (optional; lazy SessionStart fallback used instead)
- [INSTALLED] Semantic recall installed (--with-semantic)

**Why:** Captures current health state. Staleness is caused by two compounding issues: (1) cascade-starvation where stale-now verdict blocks stale-daily/weekly refresh cycles, (2) unretried haiku_timeout on weekly compression (predates v0.3.4). Cron not registered means no scheduled background distill; only lazy fallback on SessionStart. Native auto-memory running in parallel with kit layers.

**How to apply:** Register cron (`cmk register-crons`) to enable scheduled distill (best fix for busy repos). File cascade-starvation as formal task (relates to Task 105/D-75). Monitor next weekly run for timeout recovery (v0.3.4 retry now active). Commit 35 pending dogfood memory files.
