---
id: P-FJ7VQAJE
type: project
shape: State
title: Kit's Haiku Backend Has Undeclared `claude` CLI Dependency
created_at: 2026-07-04T07:43:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 436d1aab02f76be967699f4fa5fb41b15ab186e3cd707f9ff43890f9122d7b71
related: [two-tier-backend-architecture-for-headless-llm-invocation, kit-compatibility-requirement-clarified, live-test-harness-cannot-detect-missing-cli-dependency]
---

The kit's only Haiku backend is `HaikuViaAnthropicApi`, which shells out to the locally-installed `claude` CLI (authed by Claude subscription, not API key). No fallback exists.

- This was deliberate for v0.1 (ADR-0008 defers alternatives to v0.2) and was acceptable for Claude Code only.
- But the dependency was never revisited when Cursor and Kiro were added (v0.4.0 and v0.4.5).
- Result: Cursor/Kiro users without Claude Code installed will silently fail at all Haiku-dependent steps (compression, persona wedge, temporal sweep).

The constraint is currently undeclared in docs and only mentioned obliquely in ADR-0005 ("Requires Claude Code already installed").

**Why:** This is a product-scope bug. The kit appears to support Cursor/Kiro as full agents, but has a hidden hard dependency that breaks both if Claude Code isn't installed.

**How to apply:** Next session should resolve this by choosing one of three paths: (a) document Claude Code as a hard prereq for all agents; (b) add a direct-API-key fallback (`ANTHROPIC_API_KEY`) when `claude` is absent; or (c) switch to per-agent headless CLI backends (e.g., `cursor-agent -p` for Cursor).
