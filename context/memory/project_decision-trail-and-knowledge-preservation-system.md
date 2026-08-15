---
id: P-YCA3aZYT
type: project
title: Decision Trail and Knowledge Preservation System
created_at: 2026-06-19T07:15:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e02ee5b351359fe03d076fcedf2f3dfae3245e89184ddafc1e777005bcc840f9
related: [decision-log-system-for-known-limitations, decision-logging-in-task-entries, 2026-07-01-arc-complete-output-inventory-and-at-risk-layer]
---

This project uses a structured system to preserve decisions, research, and design history:
- **Decision Log**: Decisions tracked with IDs (e.g., D-173, D-174, D-175)
- **Superseded work**: Marked in DECISION-LOG as "SET ASIDE {date} by {new-decision-id}" with full rationale preserved (never deleted)
- **Research and findings**: Archived in `docs/research/` with INDEX file for retrieval
- **Design docs**: Use section references (e.g., §8.2.5) for precise cross-linking and historical context
- **Rationale always recorded**: Every decision documents *why* — the premise, measurements that falsified it, alternative paths — so future work understands the history and can safely fall back if needed

**Why:** The team frequently revisits decisions (e.g., size-cap design may return if future measurements show different constraints). Recording full context prevents re-deriving analysis and makes fallback decisions safe. Builds institutional memory and supports learning.

**How to apply:** When pivoting: (1) update DECISION-LOG with "SET ASIDE {date} by {decision-id}", (2) record measurements in `docs/research/` with INDEX entry, (3) document the premise, the measurement that falsified it, and the new direction.
