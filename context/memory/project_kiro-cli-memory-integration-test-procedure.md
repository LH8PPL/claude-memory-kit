---
id: P-96D7W57M
type: project
title: Kiro-CLI Memory Integration — Test Procedure
created_at: 2026-06-24T16:27:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 82c9e6ad0ebf4e137bf99f8cebe3a7a6e5de35fdf0feb635142f6c11a7c43fba
related: [live-test-workflow-for-kiro-cli-project-fix, memory-persistence-validation-workflow-end-to-end, cut-blocker-fix-project-routing-and-claude-memory-kit-approv]
---

Rebuild and live-test from branch:
- `npm pack` from `packages/cli/`; uninstall and reinstall globally
- `cmk install --with-semantic --ide kiro` in fresh folder
- Test via interactive `kiro-cli`; type a fact

**Expected outcome:** agent runs `cmk remember "..."` (shell CLI) — NOT `mk_remember` tool
**Success criteria:** fact lands in `context/MEMORY.md`

**Why:** Kiro bug #5873 blocks explicit tool route; CLI route is workaround. Live test confirms full integration before merge.

**How to apply:** Run this flow when validating kiro-cli memory capture. Paste the response to verify `cmk remember` is invoked and facts are saved.
