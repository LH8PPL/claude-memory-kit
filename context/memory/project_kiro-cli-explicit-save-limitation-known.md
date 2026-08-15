---
id: P-JBaZNZ95
type: project
title: kiro-cli Explicit Save Limitation (Known)
created_at: 2026-06-24T18:05:16Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f1af17de08d23486015863aafc667c30c3475fbfb993139b7cfe3b03c361ff71
related: [memory-routes-by-execution-surface, kiro-cli-custom-agent-tool-limitation, kiro-install-contains-two-independent-clients-with-separate]
---

The `cmk remember` CLI command in kiro-cli is flaky due to shell working-directory handling. Automatic hooks work reliably. Explicit saves should be documented as best-effort.

**Why:** Testing showed `cmk remember` facts didn't land due to kiro's shell cwd behavior — not a cmk defect, but an environment constraint.

**How to apply:** Document as kiro-cli known limitation. Recommend automatic hook-based capture. Explicit saves are unsupported until kiro shell paths stabilize.
