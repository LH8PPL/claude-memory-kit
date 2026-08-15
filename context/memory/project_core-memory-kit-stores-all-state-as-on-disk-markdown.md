---
id: P-D5CLV6ZA
type: project
shape: Timeless
title: Core-Memory-Kit Stores All State As On-Disk Markdown
created_at: 2026-07-27T19:09:10Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 196ffc37926ba49519178de6350f9441e53a8fdebba29110352182b1844f1ade
related: [claude-code-mcp-deferred-tool-race-issue-42148, windows-dll-lock-prevents-global-npm-install-during-active-c, use-c-temp-or-c-tmp-for-test-scratch-never-the-repo-or-home]
---

The kit's architecture stores all durable state as markdown files on disk, never as transient in-memory structures.

- Design consequence: Session crashes do not cause data loss
- Everything survives a killed process tree (no state in the claude.exe or MCP process memory)
- This makes the kit inherently resilient to abrupt termination

**Why:** Understanding this design ensures appropriate trust; the kit won't lose memory state even if processes die unexpectedly. When troubleshooting, failures must be in external systems (Claude Code, MCP) or explicit user actions.

**How to apply:** Assume the kit never loses work due to crashes — use this to rule out kit-based data loss when debugging
