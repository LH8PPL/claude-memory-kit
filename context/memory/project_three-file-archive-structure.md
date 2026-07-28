---
id: P-JG6P5HN4
type: project
shape: State
title: Three-File Archive Structure
created_at: 2026-07-27T23:04:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2f3c534216a518a3f5ec5fe0899df65f727126885a14760149b3d554f753cac6
---

Archive spans three parallel files: `specs/tasks.md` ↔ `specs/tasks-archive.md` (257 parent tasks); `docs/journey/DECISION-LOG.md` ↔ `docs/journey/DECISION-LOG-archive.md` (419 D-entries); `docs/journey/build-log.md` ↔ `docs/journey/build-log-archive-pre-v0.5.md` (build campaign). All three archive names are explicitly listed in `CLAUDE.md` "Current state" section and in live file headers.

**Why:** Archiving is project-wide (tasks, decisions, build campaigns). One unified strategy is simpler than per-document policies.

**How to apply:** When archiving, update all three files and their cross-references in CLAUDE.md. Run `validate-docs` to confirm links remain valid.
