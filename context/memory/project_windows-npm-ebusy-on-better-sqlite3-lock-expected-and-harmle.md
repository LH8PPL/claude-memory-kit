---
id: P-SSM3G7RN
type: project
title: Windows NPM EBUSY on Better-SQLite3 Lock — Expected and Harmless
created_at: 2026-06-22T18:30:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bb499ac4cc29efc3749940a5e0d2bad66210d168591ff3d536d9c8bae283e7ac
related: [windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, better-sqlite3-eperm-cleanup-warning, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil]
---

On Windows, npm uninstall/install can trigger EBUSY (errno -4082) errors on better_sqlite3.node when a process holds the binary lock (e.g., running cmk MCP server or prior global installation).

**Key insight**: Despite the errors, the install succeeds. This is expected and harmless.

- **Verification**: Run `cmk --version` to check new version is live (e.g., 0.4.0)
- **Success signal**: Version check returning new version; errors are NOT a failure signal
- **Cleanup artifact**: npm leaves orphaned temp dirs (e.g., `.claude-memory-kit-E9AXbqc9`); safe to leave or delete

**Why:** Gate test (§0b line 60-62) warns of this pattern. Understanding it prevents false alarms on Windows systems and future gate runs.

**How to apply:** Expect EBUSY on better_sqlite3.node during npm operations on Windows. Verify success with version check, not error count. Treat cleanup temp dirs as expected artifacts.
