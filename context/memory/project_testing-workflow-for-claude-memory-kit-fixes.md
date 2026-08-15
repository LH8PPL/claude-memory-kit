---
id: P-ESQMFH5J
type: project
title: Testing Workflow for claude-memory-kit Fixes
created_at: 2026-06-23T20:27:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9d379dbe0665b0e8ff62ed226253df7b80d673ff45f2a2567825927398b903d2
related: [kg-guard-retest-failed-was-stale-artifact-not-fix, d-197-end-to-end-live-re-test-workflow, live-test-workflow-for-kiro-cli-project-fix]
---

To test a fix in the codebase after a merge, follow this exact sequence:
1. Close any apps that lock native DLLs (Kiro, Claude Code) — npm pack/install will fail with EBUSY otherwise
2. In `C:\Projects\claude-memory-kit`: run `npm pack` to create a fresh tgz
3. Run `npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz` to replace the global install
4. Verify the fix is in the newly-installed source (e.g., grep/Select-String for the expected value in the matcher field of kiro-cli-agent.mjs)
5. In `C:\Temp\kiro-gate2`: run `cmk install --ide kiro` to reinstall using the new global version
6. Verify the live config got the new matcher value by running: `node -e "console.log(require('~/.aws/amazonq/cli-agents/q_cli_default.json').hooks.preToolUse[0].matcher)"`
7. Run KG-guard in `kiro-cli chat` to test the fix

**Why:** Until you rebuild the tgz after a merge, every live test runs pre-merge code. Testing against a stale global install will fail even if the fix is correct in the repository.

**How to apply:** After merging a code fix, always rebuild the artifact and reinstall globally before running live integration tests. Verify the actual installed code at each step.
