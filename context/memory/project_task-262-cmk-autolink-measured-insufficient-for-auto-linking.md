---
id: P-WC6VDB23
aliases: [P-WC6VDB23]
type: project
shape: Event
title: Task 262 — cmk autolink Measured Insufficient for Auto-Linking
created_at: 2026-08-08T14:24:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 86d76658d9661b242ceb2ec4a4ae6a1b0676d3d2bed58e251fcc0c0c8b452cfb
---

Three-band mechanism, corpus-derived floor, and backfill implementation complete and tested on real corpus. Live-test results: automatic similarity-ranked edges regress multi-hop recall (−0.111) and recover zero of the 0.444→0.889 headroom that hand-placed edges prove is available. Root cause: automatic linking solves "related enough to link" but not "related enough to answer a question"—two semantically different relations. Feature ships with defaults OFF and limitation honestly documented. Negative result validates ADR-0023's cheap path is measured insufficient, pointing LLM-cues candidate as next direction.

**Why:** Completed multi-tool analysis with concrete metrics; negative result has shaped next ADR decision. Canary discipline allowed feature to be killed by test rather than default-blessed.

**How to apply:** This negative result (−0.111) grounds the decision that deterministic linking alone cannot close the full headroom; future work should focus on LLM-cues approach rather than refining similarity scoring.
