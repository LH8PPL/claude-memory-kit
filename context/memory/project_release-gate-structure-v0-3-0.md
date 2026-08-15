---
id: P-ULTaWK4B
type: project
title: Release Gate Structure (v0.3.0)
created_at: 2026-06-11T04:50:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ba7018d1d55e3d0db2689e117c249683330cfb19
related: [uncommitted-change-in-docs-process-cut-gate-md, cut-gate-workflow-order-cut-locally-test-tag, minor-release-triggers-backlog-sweep]
---

Release process documented in `docs/process/cut-gate.md`.
- Command: `npm run release -- minor` starts the process
- Process ends with tag push
- Gate components:
  - **W1–W4 recall ladder**: headline gate (required to pass)
  - **D3**: recently changed to blocker status (was previously optional/"a shrug")
  - **SonarCloud review-marks**: pending review in their UI

**Why:** D3's promotion to required blocker is a recent change; the next release cycle must respect this gate structure.

**How to apply:** Before cutting v0.3.0 or later, follow `docs/process/cut-gate.md` top-to-bottom. Ensure W1–W4 passes and D3 does not fail.
