---
id: P-FHTR7MLS
type: project
shape: State
title: 'Release Gate: Cut-Gate Guide Must Pass Before Tagging'
created_at: 2026-07-07T12:36:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9cf320e39d419d8148073712c356e7f810ede15f114cc6a3fd6e688e064e2422
related: [urgent-resume-the-global-cmk-is-half-ins-3evdaurq, memory-persistence-validation-workflow-end-to-end, d-197-end-to-end-live-re-test-workflow]
---

The release workflow for claude-memory-kit requires cut-gate guide verification BEFORE pushing a release tag. Flow:
1. Fix global cmk installation (close MCP-hosting sessions → clean reinstall → doctor)
2. Run full cut-gate guide on new version (sessions 1–3 + cold-open, including kiro/cursor environments)
3. Tag only after guide passes

v0.5.0 was declared "ready" without this step; tag is now on hold until verification completes.

**Why:** User caught the skip and it matters: this discipline found six blockers this session. Releasing without verification risks broken code reaching users.

**How to apply:** For v0.5.0 and all future releases, do not tag until cut-gate passes. The cut-gate run for v0.5.0 will also live-prove Phase 1 evidence for issue 194.
