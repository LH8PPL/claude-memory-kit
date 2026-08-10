---
id: P-F63N9DY3
type: project
shape: State
title: cmk install skip-existing behavior and update implications
created_at: 2026-07-15T19:07:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 09869c69bd5eda54ca12a9fdf9dcbef5b8a59ba2bf092805062c8c92917e0961
related: [d-343-disposition-cmk-install-scaffold-refresh-bug-task-230, cmk-install-skips-existing-files-cannot-repair-stale-skills, d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills]
---

On existing projects, `cmk install` (first-run or re-run) skips any file that already exists, to protect user edits.

**What refreshes on re-run:**
- ✅ CLAUDE.md managed block (marker-delimited, re-stamped each install)
- ✅ Hooks in settings.json (separate merge path, wired fresh)

**What does NOT refresh:**
- ❌ Skills in .claude/skills/*.md (skipped if they exist)
- ❌ Any other scaffold file (skipped if it exists)

**Consequence:** Stale kit-authored files persist silently when kit is updated. To fix a stale skill, must delete + re-install, or hand-copy from template—no in-place refresh command exists.

**Why:** This is the core D-343 gap. Users reasonably expect install to freshen kit-provided files, but skip-existing (meant to protect user edits) leaves obsolete scaffolds behind, creating silent divergence on update.

**How to apply:** Document this clearly in install guide. Until `cmk repair --skills` or doctor-tool drift detection ships, advise users that kit updates require manual skill deletion+re-install or hand-copy from template. Use the empirical test as validation proof.
