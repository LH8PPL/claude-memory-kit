---
id: P-TDKVFRKN
type: feedback
shape: State
title: Fix lint/style warnings encountered in touched files even when pre-existing (not
created_at: 2026-07-18T12:48:40Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 4844ca016f443b52be360a8685ded918b2c36c76d89b9e536fc93d5025b7369b
related: [always-fix-markdown-lint-warnings-md022-blanks-around-headin, memory-review-discipline-before-commit, clean-pre-existing-table-lint-warnings-by-default]
---

Fix lint/style warnings encountered in touched files even when pre-existing (not from my edit) — never dismiss them as 'pre-existing, not mine'.

**Why:** The user's 2026-07-18 directive: 'always fix stuff like list-indent style warning even if it isnt from your edit' — repeated dismissals of markdownlint warnings (MD007/MD022/MD060) prompted it

**How to apply:** When an IDE diagnostic or linter warning surfaces on a file being worked on, fix it in the same batch (or a dedicated style commit if the diff is large); leave touched files cleaner than found
