---
id: P-GF2UaLAH
type: project
title: Scope Documentation Discipline — Record *Why*, Not Just *What*
created_at: 2026-06-17T06:58:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 70bb0bd6aae823900727ec8679474a1f139f1d6168582a6764784dd83a47945a
related: [f-7-spec-vs-code-mismatch-tombstone-reading-in-cmk-get, updating-cmk-requires-re-running-bootstrap-on-project-files, file-pointer-format-and-interpretation]
---

When a feature deliberately defers or does NOT build something (e.g., `cmk restore`), document in `tasks.md` the *rationale*, not just the deferral. Example: "`cmk restore` deliberately not built — read flag + archive file cover recovery; un-tombstone is write-path with reindex/composition surface deserving its own task."

**Why:** Future reader (or user months later) understands the decision and won't re-open the question or accidentally build the deferred feature in ad-hoc ways.

**How to apply:** Pair "what's deferred" with "why" in scope docs; treat tasks.md as a decision log, not a checklist.
