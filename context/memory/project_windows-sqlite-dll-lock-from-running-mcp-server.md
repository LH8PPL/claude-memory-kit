---
id: P-EMNaBNWT
type: project
shape: Timeless
title: Windows SQLite DLL Lock from Running MCP Server
created_at: 2026-07-07T12:36:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d9c79d163190c471eeb2ff276ad1f9b337b11cfdf42785df0e09d7a71a60d0d6
related: [windows-ebusy-on-npm-global-update, windows-dll-locking-during-cmk-reinstall, windows-ebusy-when-updating-cmk-during-claude-code-runtime]
---

On Windows, a running MCP server holds an EBUSY lock on sqlite.dll, preventing clean package reinstall of cmk.

Symptom: Cannot uninstall/reinstall cmk globally if an MCP-hosting Claude session is active in this directory or another.

Recovery: Close all MCP-hosting sessions → then clean reinstall cmk tarball → doctor.

**Why:** Blocks upgrade workflows silently. Surfaced when trying to verify v0.5.0; would have affected real users if code had shipped without catching this.

**How to apply:** When doing global cmk upgrades or clean installs, close MCP-hosting sessions first. Document this in upgrade/troubleshoot guides.
