---
id: P-EJ2VUaJL
type: project
title: Documentation Structure and Authoritative Homes
created_at: 2026-06-20T16:29:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 60f0a2abd3e6f9c5181670c396e281ef3e31280a9aae6e6fba56cef73fc7dfd5
related: [documentation-artifacts-and-structure, decision-trail-preservation-rule, decision-log-system-for-known-limitations]
---

- **Research**: `docs/research/` with INDEX entry
- **Decisions**: `DECISION-LOG.md` (D-numbered entries, e.g., D-180)
- **Tasks**: `tasks.md` (sub-tasks with done-criteria checkboxes)
- **Architecture**: `design.md` (numbered sections, e.g., §16.50.1)
- **Narrative**: `build-log.md` (numbered entries, e.g., §10d)
- **Kit memory**: `cmk remember` for dogfood facts

**Why:** Distributed documentation ensures each finding type lives in its canonical location and remains discoverable for future sessions

**How to apply:** Route new documentation to the correct document by type; use established numbering schemes and entry points
