---
id: P-7GaBa77M
type: project
shape: Timeless
title: validate-docs enforces catalog consistency
created_at: 2026-08-02T18:46:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 715c1f21be53937fc424800529451990b323cbf3a5d7174ed030a5588ccf7bfe
related: [pre-commit-hook-sanitizes-fact-files-for-security, archive-registration-in-documentation-map-md, research-note-parking-workflow-during-ci]
---

The `validate-docs` validator checks that every Markdown file in `docs/` has a corresponding entry in `docs/INDEX.md`. Files without INDEX entries fail validation. This is intentional and prevents orphaned or loose documentation.

**Why:** User designed this validator to keep documentation catalog consistent and discoverable. Catch loose docs before they enter the repo.

**How to apply:** When adding or editing docs, ensure INDEX.md has an entry. If working exploratory/research and catalog isn't ready, park the file in scratchpad until ready to fully integrate.
