---
id: P-U9SMNCL4
type: project
title: Kiro-cli custom agent tool limitation
created_at: 2026-06-24T18:20:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e824fdcdd56b72dc401f25723f485600ed98becfbb7bb7cdece364f9bb436b19
related: [kiro-cli-known-limitation-bug-5873-blocks-manual-mk-remember, kiro-cli-explicit-save-limitation-known, kiro-cli-wraps-mcp-servers-in-cmd-exe-undocumented-platform]
---

- Kiro does not provide custom agents with a working tool to execute commands
- This blocks manual save attempts (when the assistant tries to run a command to persist a fact)
- The same limitation exists in the MCP variant
- This is not a kit bug; it's a kiro platform constraint

**Why:** This explains why the manual "remember this" command appears to succeed but doesn't actually persist (the assistant sees a fake ✅ but nothing runs). Future sessions need to know this is by design (platform limit), not a kit defect.

**How to apply:** Document this kiro limitation in the kit's known-issues or setup guide. Don't recommend manual save as a feature in kiro-cli; lean on automatic capture instead. Claude Code and Kiro IDE have working command execution and should continue supporting full manual-save workflow.
