---
id: P-N297FN7a
type: project
shape: State
title: Kit Compatibility Requirement (Clarified)
created_at: 2026-07-04T07:49:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: eb3c88101f52027f902c0629277e9dfb19e80c0d37187588cf9fde4984c2f418
related: [v0-4-5-agent-relative-llm-backend-feature, kit-s-haiku-backend-has-undeclared-claude-cli-dependency, kiro-cli-requires-global-chat-defaultagent-because-hooks-are]
---

The kit must work for users with ONLY Cursor or ONLY Kiro installed, with no Claude Code dependency.

- **Problem:** Kit currently shells out to `claude` binary → dead engine for Cursor-only/Kiro-only users
- **Solution:** Route LLM backend through each agent's own CLI (`cursor-agent -p` for Cursor, Amazon Q CLI for Kiro)
- **Status:** v0.4.5 BLOCKED until Task 200 (research + implementation) completes
- **Research gates:** Does `cursor-agent -p` work as a one-shot scriptable call? Can we pick a cheap model? Kiro headless equivalent? Recursion/deadlock risk from spawning agent CLI inside agent hook?

**Why:** Previous misalignment — assistant treated "compatible" as "hooks wire" when user meant "user without Claude Code can actually use the kit." This is a real product requirement, not theoretical.

**How to apply:** Task 200 is the unblocking step for v0.4.5. Start Cursor research (most-confirmed CLI exists), then Kiro. Do not code until research validates feasibility.
