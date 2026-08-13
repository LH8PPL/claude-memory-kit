---
id: P-YPZNXDYR
type: feedback
title: never-overwrite-backups
created_at: 2026-06-22T18:19:25Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 77fdc157f90a9f5396994dede1ab389b7cc4e20745a74231d8c0561a0f3f458a
related: [back-up-the-user-tier-before-a-cut-gate-never-plain-delete, self-identifying-backup-names, user-tier-memory-backup-before-testing]
---

Always create a NEW backup directory for each cut-gate / backup run — never overwrite or reuse an existing backup dir, even if it has the same gate name. Use a unique suffix (timestamp or run-N) so prior backups stay intact as evidence.

**Why:** An existing backup dir from an earlier run holds the only verbatim copy of the real ~/.claude-memory-kit and ~/.aws state from that run; overwriting it destroys that evidence and could lose the original if a later restore goes wrong.

**How to apply:** Before any backup, check if the target dir exists; if it does, create a sibling with a unique suffix (e.g. _run2, or a timestamp passed in). Never Move/Copy into a pre-existing backup dir.
