---
id: P-QZCWT97Q
type: project
shape: State
title: Three Archive Splits at v0.5 Release Boundary
created_at: 2026-07-27T22:28:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c2c5ba9b5ece36b9378eec6a0bfac07fba7c6013dd1d6eb2226d868c825aeef1
---

**specs/tasks.md** → `tasks-archive.md`
- 219 completed (✓) parent entries archived byte-identical, source order preserved
- 38 open/partial entries remain untouched in live file
- 257 task IDs remain in live file as pointers

**docs/journey/DECISION-LOG.md** → `DECISION-LOG-archive-pre-v0.5.md`
- Decisions D-1…D-306 archived; D-307 onward live (D-307 is the "tag v0.5.0" decision)
- Cut falls exactly on release boundary

**docs/journey/build-log.md** → `build-log-archive-pre-v0.5.md`
- Sections §0–§9 archived; §10 onward live (includes "How to extend")
- Deliberately under-archived to preserve narrative coherence in interleaved v0.4.3→v0.5 content

**Why:** These boundaries mark the canonical v0.5.0 release point. All content verified byte-identical to main originals; zero bytes lost.

**How to apply:** Use these exact boundaries for all v0.5-era archive queries. Re-verify using byte-preservation methodology (git show + String.includes) if content-preservation is questioned.
