---
id: P-UG3CSVUB
type: project
title: Version Stamping and Scaffold Isolation
created_at: 2026-06-19T14:33:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fb1ad1b8bb0c687f7ef78fa648bcb9b08870dec932c284ff9b113cc2c3650e6b
related: [kit-update-workflow-npm-global-per-project-cmk-install, rebuilding-the-global-cmk-binary-after-code-changes, core-memory-kit-installed-with-claude-code-hooks]
---

Global package version is **separate** from project scaffolds.
- npm package carries binary + CLI
- Project's `context/`, `CLAUDE.md` block, hooks carry `:start vX` version markers
- `cmk install` or `/claude-memory-kit:bootstrap` idempotently re-stamps scaffolds with current version
- Updating package alone does NOT touch scaffolds

**Why:** This explains the silent failure: users update globally but forget per-project re-stamping, leaving mismatched versions. The separation is fundamental to the architecture.

**How to apply:** Document this plainly. Implement drift-check in `cmk doctor`: report "scaffold v0.3.3 but CLI v0.3.4 — run cmk install" to catch forgotten steps.
