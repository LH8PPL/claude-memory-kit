---
id: P-FF4H6LK7
type: project
shape: State
title: Project governance — ADRs, frozen records, and two-phase rename flow
created_at: 2026-07-14T12:47:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c11195fd6c63f844efd04d8f208d6ba8527714263ecf6c02d684c652e2ba994b
related: [text-substitution-carve-outs-for-rename, frozen-decision-log-philosophy, review-based-decision-correction]
---

Rename decisions follow a two-phase pattern:

- **Decide phase**: Write a NEW successor ADR (e.g., ADR-0013) that supersedes ADR-0012 with the bake-off verdict (KEEP vs RENAME vs cmk-as-brand). Old ADRs are frozen.

- **Execute phase**: Only if verdict is RENAME, proceed to four-tier execution.

**Frozen records rule**: Historical docs (`docs/adr/`, `docs/journey/`, `docs/conversation-log/`, `archive/`) must NOT be edited to the new name—they describe what the project was called at the time they were written and are part of the auditable decision trail.

**Why:** Maintains immutable history and prevents retroactive revision.

**How to apply:** When v0.5.4 opens, write the successor ADR. Do not edit ADR-0012 or touch historical docs during rename.
