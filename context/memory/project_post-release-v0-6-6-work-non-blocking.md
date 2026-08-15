---
id: P-GGMLZEFF
aliases: [P-GGMLZEFF]
type: project
shape: Plan
title: Post-Release v0.6.6 Work (Non-Blocking)
created_at: 2026-08-13T14:12:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 441e148e6823b610a2c821f697de444fd3a343aa01a1b1f8e23dba6b7888b29c
---

1. Viewer verdict at http://127.0.0.1:62201 (or restart `cmk view` post-upgrade) — Task 268 formal close
2. `cmk autolink --apply` — link ~1,900 remaining facts in one bulk run
3. Review CLAUDE.md NFR-10 rule (applied under grant)
4. `cmk doctor --repair` in real terminal (with `[y/N]` confirmation)
5. `perfmon /rel`
6. `cmk queue review`

**Why:** Follow-ups discovered during sweep; listed here to avoid forgetting them. None block the tag or npm publish.

**How to apply:** After tagging v0.6.6, use this list in next session. Prioritize viewer verdict and autolink first. Run these in order as post-release cleanup.
