---
id: P-UQRCYRZa
type: project
shape: State
title: 'v0.6.4 Release: cmk view + Health Signals Live'
created_at: 2026-08-02T20:01:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 149f695d3f2b9ba03c58f0ce64e921ccda68f365f13b7cc679a455cb2addbc8e
related: [v0-5-4-released-under-renamed-repo-identity, v0-6-2-published-release-state-and-contents, release-publish-workflow-git-tag-to-npm]
---

Version 0.6.4 published to npm (`@lh8ppl/core-memory-kit@0.6.4`) with GitHub Release and npm provenance verified. Key features:
- cmk view (Task 255): user-facing memory inspection tool
- Health nudge (Task 250): kit's self-repair signal with diagnostics
- Precondition tracking (Task 258): killed proposals logged with measurements

Release workflow: two grills, two builds, four review rounds, security gates, CI retry for registry blip.

**Why:** Observability milestone — users can inspect their memory and kit can signal its own failures

**How to apply:** Validate cmk view UX, check memory-off rendering, diagnose two perfmon crashes (user marked all not urgent)
