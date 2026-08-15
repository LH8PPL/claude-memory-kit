---
id: P-LXa6HBUZ
type: project
shape: Timeless
title: cursor-agent CLI Quirks and Latency Profile
created_at: 2026-07-05T20:03:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 312cc848263ceaa2348fb528601f6e8c3b813529855d6fda6a533fb2b832f66a
related: [install-system-requirements-matrix-v0-4-0, cursor-supports-headless-agent-cli-cursor-agent-p, live-test-harness-cannot-detect-missing-cli-dependency]
---

- **Print mode doesn't skip agent loop:** `cursor-agent -p` runs the full agent loop even in print mode; latency is 30–83s (vs. kiro-cli ~1s). This breaks synchronous 60s SessionEnd hooks.
- **Prompt shape requirement:** prompt must pipe on stdin; passing as positional arg is treated as a chat question, not a task instruction.
- **Timeout requirement:** 150s needed for cursor-agent calls.

**Why:** Live-tested against real cursor-agent; these quirks are load-bearing for Task 200's `makeBackend` design and D-278 routing decision (slow backends must use detached/ceiling-free paths, not synchronous hooks).

**How to apply:** When building backends that invoke cursor-agent, use stdin piping for prompts, 150s timeouts, and route through detached paths rather than 60s synchronous hooks.
