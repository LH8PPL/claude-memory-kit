---
id: P-MWQKPU54
type: project
title: cut-gate11 Pre-Session Verification Checklist
created_at: 2026-06-14T11:14:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c1838b8fd2b222ef98ebc962e418f0a4c8494b02766bfda2d2dbf442bfac8016
related: [cmk-install-with-semantic-scaffolds-semantic-recall, cut-gate-pre-release-validation-checklist-g0-g7, cmk-install-scaffolding-and-wiring]
---

16-point checklist run before Session 1:
- G1: install + doctor (expect 5 pass, 0 fail, 3 skip)
- G7: semantic search ENABLED, hybrid default
- HC-8: npm-12 binding healthy
- G2/G2b: memory write/search skills use safe tools only
- G3: CLAUDE.md points to cmk remember
- G4: scaffold cleanliness (no TODOs, placeholders, usernames)
- settings.json: hooks + mcp + cmk allow-list wired correctly
- .gitignore and git staging verified (no accidental leaks)

**Why:** Documents baseline scaffold state; confirms readiness before building; catches misconfiguration early

**How to apply:** Re-run checklist at session start on similar projects to verify no drift
