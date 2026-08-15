---
id: P-ZTU5FXK6
type: project
title: Kit Name Change (Task 195) — Timeline and Decision Point
created_at: 2026-07-02T07:39:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dbee082af77b0500f55a1fbcd4428c8fbe30b7ed28f2c22dc428a85308581b03
related: [adr-0012-deferred-product-rename-cross-agent-trigger, decision-the-user-2026-06-21-rework-kiro-support-properly-be, four-tier-rename-execution-structure]
---

Task 195 addresses renaming the kit to reflect multi-harness support (claude-code, Kiro IDE/CLI, Cursor, Codex, etc.).

**Timeline:**
- v0.2: originally deferred via ADR-0012 (condition: "IF cross-agent ships")
- v0.4.0: condition fired when Kiro shipped
- v0.4.4 cut: decision trigger — final call to make

**Assistant's recommendation (not yet user-confirmed):**
- Middle path: keep `claude-memory-kit` as repo/npm name (lower rename cost; claude-* precedent shows it doesn't block multi-agent), but elevate `cmk` as cross-agent CLI/brand (already binary, MCP key, config dir; neutral, memorable).

**Why:** Renaming costs grow with users; ADR defer condition is now live; decision needed at v0.4.4 cut.

**How to apply:** Revisit at v0.4.4 release. Compare three options: keep current name, full rename, middle path (cmk brand / claude-* repo).
