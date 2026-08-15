---
id: P-NFH69QSF
type: project
title: MCP Tool Auto-Approve (D-196) Merged But Requires Artifact Rebuild for Live Sessions
created_at: 2026-06-23T17:05:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 17a97978e7995254c723d19ec41b09ce70bad914d2e60d878790eee6a6eb0823
related: [kiro-live-test-session1-d194-d196-proven, task-165-a-root-cause-found-advanced-to-fix-lane, post-d194-artifact-update-workflow-for-kiro-trust-fix-verifi]
---

- **Status:** D-196 (MCP-tool auto-approve fix) merged to main
- **Current gap:** Live Kiro session has pre-D-196 artifact; config-level auto-approve not active yet
- **Workaround:** User manually trusted MCP tool by clicking "always add it"; approval persists in Kiro settings
- **Resolution path:** Full rebuild from `packages/cli` + reinstall globally to activate D-196 in live session
- **Timing strategy:** Rebuild can be deferred until end of Session 1; tests KH1/KH2/KC/E1 proceed with manual trust

**Why:** D-196 is the 8th cross-agent gate cut-blocker. Live session proved 4 prior fixes work. MCP-tool approval test verifies config-level fix—final piece before shipping. Deferring rebuild keeps Session 1 feedback loop tight.

**How to apply:** When ready to verify M1 final state (auto-approve by config, not manual click), do full rebuild/reinstall. Manual trusts won't interfere with config-level behavior testing.
