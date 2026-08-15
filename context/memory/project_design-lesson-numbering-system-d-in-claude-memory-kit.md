---
id: P-X5RWPJQY
type: project
title: Design Lesson Numbering System (D-###) in claude-memory-kit
created_at: 2026-06-12T15:16:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4228a421dbe17a06140d1d64834ae360398f790f
related: [pr-168-cmk-import-claude-md-command-complete, stress-testing-omitted-for-pure-read-cli-changes, stress-tests-skipped-for-pure-file-mutation-in-process-ops]
---

Project uses D-### numbered patterns to reference prior design decisions and apply them consistently:
- **D-125**: Reuse principle — route through shared safe paths rather than re-implement safety mechanisms
- **D-120**: Surface-scoped precedent — testing scope should match actual code surface (e.g., stress-test only for concurrency/spawn/hook surfaces, not pure file IO)
- **D-51**: Class for username/path leaks — absolute paths and credentials in error output / logs

**Why:** Project code reviews and PR descriptions reference these patterns to justify design choices; helps understand vocabulary and decision-tracing

**How to apply:** When reading code comments or PR bodies referencing D-###, recognize as references to documented design lessons; future sessions should know this shorthand
