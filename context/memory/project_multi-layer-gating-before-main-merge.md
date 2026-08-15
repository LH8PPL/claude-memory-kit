---
id: P-7Z4JAQLX
type: project
title: Multi-layer gating before main merge
created_at: 2026-06-14T07:09:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d1095e126db071a2e2011c66a14ffeeef24143d4
related: [comprehensive-pr-review-methodology, stress-test-phase-in-pre-merge-workflow, ci-pipeline-configuration]
---

PR validation includes three gating layers: (1) local gates (full test suite + stress tests), (2) CI gates (CodeQL + others), (3) code review. All must pass before merge to main.

**Why:** Catches issues at multiple points before they reach main; reduces risk of broken mainline.

**How to apply:** Ensure all layers are green before initiating merge; use this as the checklist.
