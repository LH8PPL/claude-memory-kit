---
id: P-67FYLTUQ
aliases: [P-67FYLTUQ]
type: project
shape: State
title: Corpus Autolink Workflow After PR 259
created_at: 2026-08-10T10:55:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0dea47f3d7b7466e2d295b34f45724a221d9ea19811091ddd338818d2d8c8248
---

Once PR 259 lands, `cmk autolink --apply` completes the entire remaining corpus (~1,895 facts) in one idempotent call with automatic index sync. Steps:
- Run `cmk autolink --apply` once
- Run `cmk reindex --boot`
- Refresh Graph tab

**Why:** User rejected manual looping as non-idiomatic. PR 259 fixes the command to self-complete, aligning with the principle "bounded runs prevent crashes, not mandate user loops" (saved as P-PM6WN3N3).

**How to apply:** After 259 lands, execute the workflow once. Existing 250 linked facts are preserved; no remainder checking needed.
