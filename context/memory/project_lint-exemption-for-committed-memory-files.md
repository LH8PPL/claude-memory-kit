---
id: P-VDSWaMS4
type: project
title: Lint Exemption for Committed Memory Files
created_at: 2026-06-23T06:49:42Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b3dc9d5fe27f02c06180182dd1d4f454d6926394938bcadbc3014e95ad022b17
related: [memory-lint-portability-research-28-projects, scratchpad-inline-html-provenance-is-the-lint-outlier]
---

Self-exempting `<!-- markdownlint-disable-file MD013 MD041 -->` header + managed `.prettierignore` block. Ecosystem-canonical solution (used by doctoc, all-contributors for generated markdown). ~0.5–1 day, zero blast radius, zero desync risk, fixes both header comments and inline provenance.

**Why:** Memory format uses inline comments for per-bullet provenance lifecycle. Markdownlint rules MD041 + MD013 flag these. Disable-directive signals "tool-managed file" (standard in ecosystem) and aligns with how other projects handle generated markdown.

**How to apply:** Add disable-comment as first line of generated memory files. Add Prettier ignore block. Test against CI linters (markdownlint, Prettier).
