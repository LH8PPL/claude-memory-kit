---
id: P-KRGYHRUX
type: project
title: Decisions Scope Semantic Fallback Warning (Task 156 Bug)
created_at: 2026-06-18T15:45:26Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1f69d30f9fad7a4aefb898551efc0691524efa6160e3fbc09dd7dfa6cc934c7a
related: [v0-3-3-bug-semantic-backend-attempted-for-keyword-only-decis, false-embedder-unavailable-alert-on-scope-decisions, misleading-embedder-unavailable-note-fires-on-keyword-only-s]
---

`cmk search --scope decisions` attempts semantic backend first. Semantic correctly rejects it (decisions is keyword-only by design per search.mjs:163). CLI then prints "semantic default unavailable (unknown-scope:decisions) — falling back to keyword" to stderr.

This frames an intentional design choice as a failure and emits to stderr — indistinguishable from the real stale-MCP-server `unknown-scope` error users are warned about.

**Fix:** Short-circuit when `--scope decisions` — skip the semantic attempt entirely and default to keyword **silently** (no warning).

**Why:** Headline feature (Task 156, decisions recall) works but looks broken. Cosmetic defect in flagship feature kills user confidence on first impression.

**How to apply:** In search.mjs or subcommands.mjs, detect `--scope decisions` early and skip semantic backend attempt, defaulting straight to keyword with no output.
