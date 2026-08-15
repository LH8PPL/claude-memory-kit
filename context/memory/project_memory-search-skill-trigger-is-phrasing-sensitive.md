---
id: P-QZS2XMKP
type: project
title: Memory-search skill trigger is phrasing-sensitive
created_at: 2026-06-14T12:20:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a84e5480b1047ef3f2aa718a761c77ad9d7a4152c0c74aa58e34f69381b1be34
related: [session-2-validation-gates-cut-gate15, memory-recall-fix-incomplete-structure-questions-still-code, claude-code-mcp-deferred-tool-race-issue-42148]
---

- Fires on canonical phrasing: "what did we decide about [X]?"
- Does not fire on structural questions ("how is this project structured?") — crawls code instead
- Underlying mechanism (skill, MCP, cmk search) works correctly when triggered
- Root cause: trigger description tuned to exact canonical phrasing, not broader recall-shaped questions

**Why:** Explains variance in early test runs; clarifies this is a trigger-detection polish issue (fixable), not mechanism failure (blocker)

**How to apply:** Use "what did we decide about..." phrasing to reliably invoke memory-search. Or expand trigger description to cover variations like "where does X live", "how is X structured", "what are my rules for X"
