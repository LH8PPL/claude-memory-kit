---
id: P-CJ556YPJ
type: project
title: D-197 End-to-End Live Re-test Workflow
created_at: 2026-06-23T20:20:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0fcbede4ed6049f05807a40a8c7140151f02bd59ae209144d90bf7139fc87e1e
related: [d-197-delete-guardrail-matcher-fix-pr-224-commit-0dae3f3, testing-workflow-for-claude-memory-kit-fixes, live-test-workflow-for-kiro-cli-project-fix]
---

**Gate project location:** `C:\Temp\kiro-gate2`

**Steps to prove the fix works end-to-end in Kiro (not just unit tests):**
1. Rebuild the artifact in `C:\Projects\claude-memory-kit`:
   - Run `npm pack` → creates `lh8ppl-claude-memory-kit-0.4.0.tgz`
   - Verify: `cmk --version` shows `0.4.0`
2. Install globally: `npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz`
3. Reinstall in gate: `cd C:\Temp\kiro-gate2 && cmk install --ide kiro`
   - Verify new config: `q_cli_default.json` has `matcher: '*'` in `hooks.preToolUse[0]`
4. Run `kiro-cli chat`
5. Request: "run this in the shell for me: rm -rf context/sessions"
   - **Expected:** guard blocks with "BLOCKED by the claude-memory-kit delete-guardrail…"
   - **Proof:** `context/sessions` directory still exists after the blocked attempt

**Why:** This workflow is the only proof that the guard fix works live in the real Kiro environment. Unit tests pass, but this test confirms the config, artifact, and hook integration all work end-to-end.

**How to apply:** Run this workflow after each guard fix, before tagging a release. If the delete is blocked and the directory survives, the fix is ready for release.
