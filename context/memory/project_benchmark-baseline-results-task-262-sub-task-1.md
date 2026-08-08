---
id: P-RAPFC7A7
aliases: [P-RAPFC7A7]
type: project
shape: State
title: Benchmark Baseline Results — Task 262 Sub-task 1
created_at: 2026-08-08T09:09:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3a582affb32319a9005d131598a487065842ca99e4886f7a480da185f29a01fe
---

- **Flat pipeline (no linking)**: flat questions 1.000 recall, relational questions 0.444 recall
- **Hand-placed edges (oracle linking)**: relational questions 0.889 recall
- **Gap linking must close**: 0.444 → 0.889 (Δ = 0.445 recall points)

This baseline establishes the measurement canary validating the linking concept. It quantifies performance gaps between no-linking, oracle-linking, and where the actual mechanism must reach.

**Why:** Concrete baseline numbers are essential for measuring progress on sub-tasks 2–4. These come from real benchmark runs and define the validation targets.

**How to apply:** Use these as success criteria for the linking mechanism. Relational-question recall of the flat pipeline (0.444) should improve toward 0.889 as implementation proceeds.
