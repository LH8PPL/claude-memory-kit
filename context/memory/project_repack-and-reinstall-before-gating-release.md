---
id: P-C6QLGQA3
type: project
shape: Timeless
title: Repack and Reinstall Before Gating Release
created_at: 2026-07-07T18:28:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3d6b481f7f2f62dcb20cecb52d3871e60dd245b82c58120cf7db4759faa1a8f7
related: [rebuilding-the-global-cmk-binary-after-code-changes, gate-check-g0-cli-version-verification, cut-gate-must-test-published-artifact-not-repo-code]
---

Before running the cut-gate procedure, the npm tarball must be repacked from the fixed branch and reinstalled globally. This ensures the gate runs against the fixed binary, not a stale pre-fix build. Procedure: (1) repack tarball from fixed main, (2) stop MCP servers to free the native binding DLL, (3) npm reinstall globally, (4) verify installed files. Skipping this risks gating against a buggy build.

**Why:** The kit's global instance is what the gate uses. Running against a pre-fix tarball causes the gate to pass broken code.

**How to apply:** Before each gate run, execute the repack+reinstall sequence and verify the installed version matches the fix.
