---
id: P-T5S9F5BB
type: project
shape: Plan
title: Release Roadmap v0.6.1 — v0.7.0 and Task 95 Timing Logic
created_at: 2026-07-20T12:33:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5babe0e0a1177b396e59a69230e6d15d844a32ac9faeb9f781ac55dcbab5552a
related: [session-state-at-pause-2026-07-20-pre-compact-v0-6-0-shipped, version-roadmap-v0-6-1-through-v0-6-2, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil]
---

- **v0.6.0** (shipped): Day-One Memory differentiator; npm published with provenance
- **v0.6.1**: Capture-completeness polish — Task 174 (git-history backfill), 235 (PreCompact), 236 (count gate)
- **v0.6.2**: CI/supply-chain — Task 240 (CI pin), 241 (fact-walk dedupe), 237 (supply-chain watch)
- **v0.7.0**: Task 95 (memory self-improvement) + Task 189 (ROI measurement)
- **Why 95 ships in v0.7.0, not v0.6.1**: Task 95's winning synergy is import→re-curate: `import-sessions` bulk-loads history; 95 cleans it. Shipping 95 in v0.6.1 means re-curating *empty* corpora. The gap until v0.7.0 is when v0.6.0 users generate the real import data 95 needs to test against.

**Why:** Task 95 is a differentiator (belongs in MINOR by D-24), but also has a hard data dependency that only real usage can satisfy. Timing prevents shipping a feature with no meaningful test data.

**How to apply:** For features with live-data dependencies, delay to the next MINOR to allow adoption of the prior version. This transforms the gap into an incubation period where test data accumulates.
