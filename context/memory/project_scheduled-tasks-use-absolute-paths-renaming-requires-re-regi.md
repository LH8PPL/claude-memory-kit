---
id: P-BDDJFJX5
aliases: [P-BDDJFJX5]
type: project
shape: State
title: Scheduled Tasks Use Absolute Paths; Renaming Requires Re-registration
created_at: 2026-08-03T13:06:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6a801699ac7a3b9c1680d7891ed20a80d4fa65f3e39b3aee42bcddde2626d795
---

The system registers two scheduled tasks (`cmk-daily-distill`, `cmk-weekly-curate`) with absolute paths. After a folder rename, these tasks fail silently (starvation-class bug).

**To rename:**
1. Close VS Code and active shells in the folder
2. Rename the folder
3. Run `cmk register-crons` (re-writes task paths)
4. Run `cmk doctor` (verify all checks pass)

**Safe to rename (no re-action needed):**
- Index: 2,206 file paths stored relative, zero absolute paths
- `context.local/`: no absolute paths
- Git: remote is URL-based
- Hooks: use PATH-based binary names

**Side effect:** Claude Code's project slug is derived from folder path. Old session history stays under old slug, but kit memory in `context/` travels with the repo.

**Why:** Documents path-dependent configuration and the fix to prevent starvation bugs on rename. Explains the Claude Code slug change to prevent confusion about missing session history.

**How to apply:** Follow the 4-step procedure if renaming. Know old Claude Code sessions won't follow, but kit memory persists with the repo. Reuse this procedure for future renames.
