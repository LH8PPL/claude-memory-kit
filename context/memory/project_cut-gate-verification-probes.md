---
id: P-B4CANFVU
type: project
title: Cut-Gate Verification Probes
created_at: 2026-06-16T06:43:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 22bd033d9c3bb5405554a4c05023e9024136ce3a260584ad351b132621e9dcd7
related: [v0-3-2-new-validation-gates, current-gate-artifact-v0-5-0-with-task-148-and-sonarcloud-fi, release-workflow-commit-cut-gate-tag-push]
---

The release cut-gate (manual verification step, cut-guide §0b onward) uses four named probes:
- FQ1
- DJ1
- DJ2
- DJ3

All verified and current for v0.3.2.

**Why:** These probes verify the built artifact before publishing. Knowing their names helps locate them in the release guide.

**How to apply:** When running the cut-gate (step 2), execute each probe as specified in the guide and confirm all pass before tag-pushing.
