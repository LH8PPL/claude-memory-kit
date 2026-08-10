---
id: P-CGDDGLaS
aliases: [P-CGDDGLaS]
type: project
shape: Timeless
title: Canary Discipline — Validate Features Before Enabling Defaults
created_at: 2026-08-08T15:16:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2172f79297dd805b8c24df0833651cae02ad626bf5e97ba1c21f9af78cf9232b
related: [task-262-cmk-autolink-measured-insufficient-for-auto-linking, architecture-decisions-recorded-in-adrs, semantic-search-vs-grep-trade-off-d-111-design-rationale]
---

Features ship complete but with defaults OFF if measured benchmarks show regression. Task 262 example: the linking mechanism works live (would add 4,903 edges to 1,843 facts), but multi-hop recall regresses −0.111 vs. baseline, so default is OFF (D-436). The mechanism remains available via `cmk autolink --apply` or future override.

**Why:** Prevents shipping features that regress live performance. Negative measurements are equally valuable — they inform next moves (e.g., pivot to LLM-cues candidate) and prove the validation system works as designed.

**How to apply:** On feature completion, run benchmark + dry-run on real corpus. If either shows regression, ship default-OFF. Record decision and evidence in an ADR/D-entry for future reference.
