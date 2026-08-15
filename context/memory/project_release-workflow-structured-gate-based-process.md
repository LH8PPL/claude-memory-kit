---
id: P-CECC9FDR
aliases: [P-CECC9FDR]
type: project
shape: Timeless
title: 'Release Workflow: Structured Gate-Based Process'
created_at: 2026-08-03T14:04:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2e20147a9c3481af6a192a216b9dbe64b9a860183e4b6b794d8a4f9ca3ddf3dd
related: [v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g, release-workflow-pattern]
---

v0.6.5 release follows a defined multi-stage process:
  - Visual research and specification (eight ranked changes identified)
  - Build with strict constraints (zero new dependencies, zero behavior change, anti-XSS discipline)
  - Reviewer pass (visual before/after comparison via `cmk view`)
  - Fix round (address review findings)
  - Release
Each stage has clear inputs/outputs and gate criteria.

**Why:** Ensures consistent quality, traceability, and non-regressing changes across releases.

**How to apply:** When resuming or planning future releases, follow this same structured workflow and use these gates to verify completion.
