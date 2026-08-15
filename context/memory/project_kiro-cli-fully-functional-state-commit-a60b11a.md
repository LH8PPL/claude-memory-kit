---
id: P-ATGVZCWS
type: project
title: Kiro-CLI Fully Functional State (Commit a60b11a)
created_at: 2026-06-24T19:32:23Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a29d96a0d5cd2b01a2d5a10685715851142b7e1b2064018ae5a2a6fb0ca5596c
related: [live-test-workflow-for-kiro-cli-project-fix, disable-mcp-in-ide-wrappers-with-includemcpjson-false, memory-persistence-validation-workflow-end-to-end]
---

As of branch `fix-kiro-cli-mcp-project-resolution`, commit a60b11a:
- All 3 agents working: Claude Code, Kiro IDE, kiro-cli
- No unwanted popup (`includeMcpJson: false`)
- Automatic memory hooks operational
- Explicit `cmk remember`/`cmk search` commands functional
- Dead MCP project machinery removed (~46 net lines)

Code is clean, tested, validated. Ready for v0.4.0 release prep.

**Why:** Represents the end state of a long debugging cycle; system is stable and proven.

**How to apply:** Use as baseline for v0.4.0 release workflow. Optional: test bare `cmk remember` (no `--project` flag) to determine if further simplification is possible.
