---
id: P-ZKaQ69MX
type: project
title: Pre-Release Documentation Audit Checklist
created_at: 2026-07-01T11:46:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5f385448682ffa2f8dd0db50c7b810e8a3705d429fdea55566dc03713cbb64be
related: [documentation-architecture-authoritative-files-and-verificat, paper-trail-convention-tasks-md-as-single-source-of-truth, release-workflow-validation-changelog-consistency-tag-and-pu]
---

10-part checklist before tagging:

1. **CHANGELOG** — version entry + status wording correct
2. **tasks.md** — all shipped tasks marked [x]
3. **DECISION-LOG** — all decisions (e.g., D-244–D-248) present
4. **design.md** — architecture sections current; behavioral changes documented (§9.2.3 for search-index behavior in v0.4.3)
5. **CLI.md** — verb list current (33 verbs)
6. **MCP.md** — tool & param counts current (11 tools, 33 params)
7. **root README** — version & links accurate
8. **npm README** — version & npm-adapted links accurate
9. **RELEASE-PLAN** — all tasks laned to versions
10. **All validators + CI** — passing

Core principle: **single-source-of-truth** — design.md is authoritative; behavioral changes (especially architectural/indexing) must be documented there.

**Why:** Catches gaps before shipping. Ensures future contributors understand system design. v0.4.3 example: 182/183 indexer fix had to be documented in §9.2.3 (indexer walks scratchpads, skips seeds) to complete the record. User's checkpoint question ("all docs updated?") catches exactly this.

**How to apply:** Run checklist before every release. When code behavior changes, update design.md immediately. Treat user's pre-release "docs updated?" as a forcing function for this audit.
