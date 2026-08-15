---
id: P-XML7J7a5
type: project
title: Kit Shell Permission & Command Trust Boundary
created_at: 2026-06-24T20:31:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3ce70c0191081eafdb430b6cf7dbb7882ce999f8782ec4122e109f1a27c09e0e
related: [mcp-prompt-gate-only-appears-in-non-default-agent-scenario, memory-safety-guard-prevents-agent-bypass-attempts, autopilot-merge-rules-for-install-surface-changes]
---

Kit pre-trusts only its own commands (`cmk hook`, `cmk remember`, etc.). Arbitrary shell commands (`python`, `cd`, etc.) require explicit user approval. Memory commands (`cmk remember`) should NOT trigger approval prompts — that is the expected behavior from the D-199 fix.

**Why:** Security boundary: kit commands are internal and trusted; user commands need approval. D-199 eliminated unnecessary prompts for kit's own memory operations.

**How to apply:** When testing, approve non-kit shell commands via "Yes, single permission". Memory commands should pass silently. This split behavior is correct.
