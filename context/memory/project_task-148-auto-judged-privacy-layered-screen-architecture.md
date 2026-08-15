---
id: P-2FUKaR2M
type: project
shape: Plan
title: Task 148 — Auto-Judged Privacy Layered Screen Architecture
created_at: 2026-07-07T19:53:50Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b44862aee98d3542df99823cac1d7f93e77d50d70df016797f1482560f24ea5e
related: [two-layer-pii-screening-l1-sync-l3-async-judge, pii-detection-landscape-regex-vs-llm-trade-offs, task-148-v050-scope-transcript-path-not-just-fact-classifier]
---

- **L1 (hot path)**: Presidio-style JS pattern catalog (emails, phones, paths, IPs) extending Poison_Guard — ~2ms
- **L3 (detached child)**: Haiku with Anthropic's official PII-purifier prompt — redacts names, health, addresses; returns full redacted text
- **L2 (rejected)**: Local NER model — domain-brittle, heavy dep; Haiku covers it
- **Four forks with recommendations:**
  1. Transcript screen → deferred-promote (hot path writes to `.tmp` gitignored staging; child screens & appends screened text to committed tier)
  2. Haiku-down posture → fail-closed (retry next turn if Haiku unavailable)
  3. Explicit path (`cmk remember`) → L1-only, sync (user-authored, override with `<private>`)
  4. False-positive recovery → gitignored NDJSON redaction log (original→placeholder, machine-local)
- **Core 148**: `sensitivity: commit|local-only|drop` axis on auto-extract fact classifier
- **Testing**: TDD build with Poison_Guard-style tests + cold-open-replay test proving exact leak caught

**Why:** Novel feature (confirmed no prior art); fail-safe by construction; solves real incident

**How to apply:** Use as implementation spec; TDD validates all four forks
