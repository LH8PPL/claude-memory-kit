---
id: P-RXFPBRQC
type: project
title: Allow-list Entries Centralized in settings-hooks.mjs
created_at: 2026-06-26T16:10:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cde762a105156dbd97f684e30869f0ab106810c6dd1afdae257feefe06935040
related: [claude-code-2-1-191-requires-both-skill-forms-in-allow-list, skill-composition-pattern-scaffold-allow-list-must-be-update, research-notes-indexed-via-research-index-not-documentation]
---

The `settings-hooks.mjs` KIT_ALLOW function is the single write-site for all allow-list entries in the kit. Both npm and plugin distributions funnel allow-list generation through this one function. A format change (e.g., adding the wildcard Skill form) requires updates in only one place.

**Why:** Centralization prevents drift and inconsistency between distributions, making the kit maintainable and responsive to upstream changes.

**How to apply:** When fixing or extending allow-list entries, modify only `settings-hooks.mjs`. Verify changes via the install-hooks test suite.
