---
id: P-FQJZRA2B
type: project
shape: State
title: Research Verification Workflow — Parallel Agents & Batch Integration
created_at: 2026-07-21T11:52:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 04f7b1c22f375f85ab9296b709f530a0c22142344c71aec7198ef192aa83c0fc
related: [research-verification-process-uses-paral-zsfnnkgq, local-wiki-research-verification-workflow, laundering-detection-official-spec-vs-community-reimplementa]
---

- Run parallel background verification agents to check claims against primary sources
- Document findings with specificity: verdicts (CONFIRMED / ABSENT / CONTRADICTED) with line-item details on *where* found/not found
- Store findings as `docs/research/YYYY-MM-DD-<topic>.md` timestamped files
- After all agents complete, integrate in one batch commit covering: INDEX registration, SOURCES rows, DECISION-LOG, task annotations linking research to implementation

**Why:** Surfaces whether design claims are officially documented, speculative, or laundered from unofficial sources — critical for validating decisions (e.g., Task 95) against actual specs.

**How to apply:** When planning research tasks, set up parallel agents with explicit "open questions" checklist, document each finding with specificity, defer integration until all agents land.
