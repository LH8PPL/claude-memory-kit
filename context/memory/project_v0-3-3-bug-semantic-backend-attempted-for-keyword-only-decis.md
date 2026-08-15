---
id: P-5M3QY5B6
type: project
title: v0.3.3 Bug — Semantic Backend Attempted for Keyword-Only Decisions Scope
created_at: 2026-06-18T18:22:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c60b9ad0e13cc99f570675af3fbef29394219546e6eb93a6c8ebe48065ca4841
related: [decisions-scope-semantic-fallback-warning-task-156-bug, false-embedder-unavailable-alert-on-scope-decisions, misleading-embedder-unavailable-note-fires-on-keyword-only-s]
---

`subcommands.mjs` attempts the semantic backend for `--scope decisions` even though `search.mjs` already validates that decisions is keyword-only. The semantic backend correctly rejects it, then the search command prints a scary stderr warning: "semantic default unavailable (unknown-scope:decisions) — falling back to keyword". This makes the working, intentional design look broken. The message is indistinguishable from the stale-MCP-server bug the guide warns about.

**Why:** The default search mode is hybrid (attempts semantic first), and the code does not short-circuit for decisions scope before attempting semantic. `search.mjs:163` has explicit validation that decisions is keyword-only, but `subcommands.mjs` ignores this and tries semantic anyway, generating a false-failure warning for expected behavior.

**How to apply:** Fix by skipping the semantic backend entirely when `scope === 'decisions'` — go straight to keyword silently, with no warning. This is a small, targeted v0.3.3 patch that should ship before the release tag, not defer to v0.3.4.
