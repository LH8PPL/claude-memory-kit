---
id: P-WYEEXZRN
type: project
title: 'Root cause: roll mechanism fires only at SessionStart/SessionEnd, not turn bound'
created_at: 2026-06-20T07:19:01Z
write_source: user-explicit
trust: high
source_file: review-promote
source_line: 1
source_sha1: 3133d6d93f8fe3e2fbf4bfa0d526efb59fac933ea2f98693d451b30c830e7b84
related: [kit-s-memory-system-uses-a-now-today-rec-5whkzpr3]
---

Root cause: roll mechanism fires only at SessionStart/SessionEnd, not turn boundaries, so `now.md` accumulates entire-session content before draining.
