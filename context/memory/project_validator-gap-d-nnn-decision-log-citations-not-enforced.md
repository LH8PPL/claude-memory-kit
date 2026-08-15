---
id: P-PJ7GCV7M
type: project
shape: Absence
title: Validator Gap — D-nnn (Decision-Log) Citations Not Enforced
created_at: 2026-07-21T13:49:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d1001e964da21e10321ed5c790d36f1f0dabab5b38481b6ed9ab96bb51e345ed
related: [validate-docs-citation-gap, decision-log-validation-gap-d-nnn-ids, validate-references-requires-properly-filed-task-references]
---

`validate-docs` checks ADR-NNNN, FR-N, Task N, and §N.N references but omits D-nnn (decision-log) tokens. Citations are on the honour system.

**Why:** Discovered while writing docs: user cited D-382 in commit messages before the entry existed, and drift happened within hours. Showed that unstructured citations rot.

**How to apply:** Consider expanding validator to check D-nnn format, or document the limitation so future contributors know decision-log references are not structurally enforced.
