---
id: P-43QCZHHH
type: project
shape: State
title: Screened Writes Pattern
created_at: 2026-07-10T20:50:55Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3808b495da963af00758188884e00d7ced5772ecaaa3e4fe395053d05f10f9c2
related: [claude-md-checkpoint-4-pre-commit-screening-rule, memory-commits-screened-before-release]
---

Both `write-fact` and `import-anthropic-memory` must screen `title` + `body` through Poison_Guard and home-path sanitize before committing. Prevents secrets in version control.

**Why:** Real incidents: `cmk remember --title "ghp_<token>"` wrote secrets to committed frontmatter (write-fact gap); import-anthropic-memory laundered data with zero screening.

**How to apply:** Any new committed-write path applies screenBeforeCommittedWrite before writing. Task 216 batches this across remaining unscreened sites.
