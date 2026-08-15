---
id: P-GHNBU9J4
type: project
title: Live KG-guard Config Location and Verification
created_at: 2026-06-23T20:27:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8b76e674f5f8000dfe5b516ad979a2bcf131c66827aeee52cca00e65bdf48014
related: [testing-workflow-for-claude-memory-kit-fixes, d-197-delete-guardrail-matcher-fix-pr-224-commit-0dae3f3, d-197-end-to-end-live-re-test-workflow]
---

The live KG-guard matcher config is at: `~/.aws/amazonq/cli-agents/q_cli_default.json`
Target field: `hooks.preToolUse[0].matcher`
After fix is applied, this should be `'*'` (not the old pipe-string format like `'execute_bash|executeBash|shell'`)
Verify with: `node -e "console.log(require('~/.aws/amazonq/cli-agents/q_cli_default.json').hooks.preToolUse[0].matcher)"`

**Why:** KG-guard reads this live config, not the source code. An outdated config means the test exercises old behavior even if the code was fixed.

**How to apply:** After running `cmk install`, always verify this file has the correct matcher value before running KG-guard tests.
