---
id: P-THHJ4TVU
type: project
title: Task 66 Subtask Dependencies and Next Gate
created_at: 2026-07-02T11:40:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 93eb5a70ce038e25cabc8ecf32c65e755e6735e9b138cf8b738a3803d6e816c2
related: [v0-4-4-build-order, v0-3-0-released-with-green-quality-gate, contradiction-detection-design-d-259]
---

Task 66 has four subtasks with out-of-sequence delivery. 66.1 (shape classification) and 66.3 (expires_at enforcement) are complete. 66.2 and 66.4 (validity windows + contradiction-catch demo) are gated on design-grilling to resolve:
- `state_key` heuristic vs. LLM detection pass for contradiction detection
- captain-claw's "hold the tension" idea (D-221) vs. latest-wins rule

**Why:** Task 66.2/66.4 cannot proceed until these design forks are resolved; contradiction-DETECTION strategy is the critical path blocker.

**How to apply:** Next session: run design grill interview before 66.2/66.4 implementation. Outcome determines contradiction-catch demo surface architecture.
