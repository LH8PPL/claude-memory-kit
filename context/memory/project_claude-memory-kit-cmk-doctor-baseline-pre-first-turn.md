---
id: P-QC26V7EB
type: project
title: Claude Memory Kit — cmk Doctor Baseline (Pre-First-Turn)
created_at: 2026-06-11T11:32:50Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b8df7ca1fa21547ca5eb18282bc6e36f347a33f0
related: [doctor-health-check-baseline-fresh-install, fresh-cmk-install-expected-cmk-doctor-baseline, fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic]
---

Before the first session turn, `cmk doctor` should report:
- **4 pass** (core health: paths, lock discipline, hook availability, memory-write skill)
- **0 fail**
- **3 skip** (expected: no transcripts yet, no distill/cron jobs scheduled, no weekly curator activity)
Skip count increases after first turn as sessions/transcripts/crons are generated.

**Why:** Baseline expectations distinguish healthy early state from actual failures. Skip count acts as a maturity indicator — changing skip counts are normal and reflect the system warming up.

**How to apply:** Run `cmk doctor` after install; expect these exact counts before any turns. If you see >3 skips pre-first-turn, investigate what's missing. Post-first-turn, skips naturally drop.
END_FA
