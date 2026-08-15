---
id: P-AAXE5QX3
type: project
title: 'D-197 Delete-Guardrail Matcher Fix (PR #224, Commit 0dae3f3)'
created_at: 2026-06-23T20:20:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2c60aadb0ad02bc8513501facd3fdb03caac767555915429d2dc0de92f9a747b
related: [d-197-end-to-end-live-re-test-workflow, kg-guard-retest-failed-was-stale-artifact-not-fix, testing-workflow-for-claude-memory-kit-fixes]
---

The fix updates the guard matcher from a pipe-string pattern to `matcher: '*'` in the hook config.

**What changed:**
- Location: `hooks.preToolUse[0].matcher` in `q_cli_default.json`
- Old: pipe-string pattern (unreliably blocked deletes)
- New: `matcher: '*'` (wildcard, robustly blocks all deletes at the gate)
- Artifact version: 0.4.0
- Commit: 0dae3f3 (PR #224, now merged to main)

**Expected runtime behavior:**
When a user attempts `rm -rf context/sessions` in Kiro, the guard intercepts it with message "BLOCKED by the claude-memory-kit delete-guardrail…" and `context/sessions` survives the blocked attempt.

**Why:** The old matcher pattern failed to consistently intercept delete commands. The wildcard matcher is more robust and catches all deletion attempts.

**How to apply:** After merging guard-related fixes, rebuild (`npm pack`), reinstall globally and in the gate project, then verify the config JSON has the wildcard matcher before running the live re-test.
