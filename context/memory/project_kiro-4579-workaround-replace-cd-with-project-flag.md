---
id: P-D6E2HXN3
type: project
title: 'Kiro #4579 Workaround: Replace `cd` with `--project` Flag'
created_at: 2026-06-24T18:45:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6b15c54fed4d934b520a5159ed8ea4f1a5206c5d977e125a5010b2240dbf5c06
related: [use-mcp-mk-remember-not-bash-cli, kiro-bug-5873-explicit-tool-route-blocked, mcp-prompt-gate-only-appears-in-non-default-agent-scenario]
---

**Problem:** Kiro #4579 — `cd` commands don't persist across tool calls in kiro-cli custom-agent sessions, breaking explicit memory save workflows.

**Solution:** Use `--project` flag when invoking `cmk remember` and `cmk search`, avoiding `cd` entirely.

**Implementation Details:**
- CLI now accepts `--project <path>` for `cmk remember` and `cmk search`
- Path normalization handles multiple formats (e.g., `/c/Temp` → `C:/Temp`)
- Agent prompt instructs: "NEVER use `cd`, pass `--project <path>` instead"
- Tested: works from any cwd with both Unix and Windows path formats
- Code is generic, no hardcoded paths (only in comments/test commands)

**Why:** Unblocks explicit memory save in kiro-cli custom-agent contexts (critical blocker resolved)

**How to apply:** Future agent sessions in kiro-cli should pass `--project <project-root>` to `cmk remember`/`cmk search`, never use `cd`
