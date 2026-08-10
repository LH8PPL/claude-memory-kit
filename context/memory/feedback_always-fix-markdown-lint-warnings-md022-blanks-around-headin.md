---
id: P-UFWMKQ99
type: feedback
title: Always fix markdown lint warnings (MD022 blanks-around-headings, MD047 trailing-
created_at: 2026-06-25T13:29:31Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: ce76206682c99c607c690041922a7fe60cd2a2aeef65f2d917d1fdfaa388123e
related: [fix-lint-style-warnings-encountered-in-touched-files-even-wh, user-ci-lints-memory-files-gap, memory-review-discipline-before-commit]
---

Always fix markdown lint warnings (MD022 blanks-around-headings, MD047 trailing-newline, etc.) when touching a file — do not leave them for later.

**Why:** The user's standing directive 2026-06-25. The kit commits memory into the user's repo; a user whose CI lints markdown gets warnings, so every file the agent writes/edits must be lint-clean by construction.

**How to apply:** When editing or writing any .md (including context/ memory files, docs, READMEs), ensure: blank line above AND below every heading (MD022), single trailing newline (MD047), blanks around lists/code-fences. If the IDE surfaces an MD diagnostic after an edit, fix it in the same turn — never defer.
