---
id: P-7KDNP4NS
type: project
title: 'Reflection Model Upgrade: `deprecated_by` Frontmatter'
created_at: 2026-06-25T19:40:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a58a17a5d37e22e07a6fd0bbdb271b4749632f82255c7460721c69c25b49ae0b
related: [canonical-registry-for-persona-search, research-faithful-design-in-sweep-order-implementation, npm-deprecate-wildcard-syntax-fails-with-e404-use-version-ra]
---

EverOS uses a structured reflection flow: Select → Merge → Re-extract → Deprecate, with frontmatter `deprecated_by` marking superseded entries. This is more principled than the kit's rolling-window approach for the persona/consolidation layer.

**Why:** Task 151 (persona consolidation) needs a robust reflection strategy; EverOS's pattern is proven and more systematic.

**How to apply:** For Task 151, evaluate adopting EverOS's `deprecated_by` frontmatter and Select→Merge→Re-extract→Deprecate flow instead of rolling-window.
