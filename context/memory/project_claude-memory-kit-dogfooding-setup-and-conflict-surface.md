---
id: P-AC54GXEH
type: project
shape: State
title: Claude-Memory-Kit Dogfooding Setup and Conflict Surface
created_at: 2026-07-12T12:01:50Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c0cc7b92e5618dc0a673ecc0f84f618cf43538162c242604c8c3f692003256e1
related: [task-205-preflight-fires-on-wrong-trigger-design-flaw, task-205-preflight-ux-design-wart, use-mcp-mk-remember-not-bash-cli]
---

The kit dogfoods itself on its own repo (`C:\Projects\claude-memory-kit`) with live MCP servers (`cmk mcp serve` PIDs 30444/30384) and active auto-extract child processes writing to `context/transcripts/` during development and cut-gate work. These processes hold locks on the shared global `@lh8ppl/claude-memory-kit` binary in `AppData\Roaming\npm`. This creates a real hazard: attempting `npm install -g @lh8ppl/...@latest` while these servers are active can trigger D-302 (half-install with locked DLLs).

**Why it exists:** Dogfooding mirrors real-world multi-process scenarios that green suites cannot reproduce.

**Why it matters:** This setup is the *reason* Task 205's MCP preflight warning exists—and also exposes why the warning is coupled to the wrong trigger (it fires on `cmk install` to temp folders, not on `npm install -g` upgrades where the hazard actually lives).

**How to apply:** When evaluating Task 205 or cut-gate findings about MCP/global conflicts, recognize that the kit's own repo is a live test environment. This is intentional; use it as a lens for evaluating whether warnings are coupled to the right command or are over-broad friction.
