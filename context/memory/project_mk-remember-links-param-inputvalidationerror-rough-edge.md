---
id: P-27PL2ZB5
type: project
title: mk_remember links param InputValidationError (rough edge)
created_at: 2026-06-27T07:24:33Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 900e5041fb659caae5ca6b997b930671b4f8ed5ecaeea793f74b9b85ce67c8aa
related: [claude-code-mcp-deferred-tool-race-issue-42148, task-164-followup-claude-md-template-md022, consult-the-user-before-shipping-a-fix-mid-live-diagnosis]
---

SEPARATE bug found in cut-gate-v041e: the first mk_remember MCP call errored with InputValidationError "The links value wasn't a valid array" — Claude passed a malformed links param. It self-recovered on retry, but the mk_remember MCP tool's links param validation rejects what the model naturally sends. Track as a rough-edge follow-up (not a permission bug, not blocking v0.4.1 prompt-free diagnosis).

**Why:** A tool that rejects the model's natural input on first try and forces a retry is a UX rough edge worth fixing — even though it self-recovers, it wastes a turn and could confuse a less-capable model.

**How to apply:** Investigate mk_remember's links zod schema in mcp-server.mjs — likely it requires an array but the model sends a string/object. Consider coercing or loosening. File as a task in a later lane.
