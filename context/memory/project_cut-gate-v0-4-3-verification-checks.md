---
id: P-SLYA3XLY
type: project
title: Cut-gate v0.4.3 Verification Checks
created_at: 2026-06-30T20:23:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 26acbfd86d4c20d5af1d95497f06fbc2ee80be067a8acac46af6bf3a5fa68480
related: [tool-quirks-discovered-in-v0-4-3-testing, fresh-folder-verification-workflow-for-claude-memory-kit-rel, post-215-merge-workflow-gate-continuation]
---

Five live-tested probes verified in sandbox before v0.4.3 release:
- **PR1**: Rich fact re-statement bumps `recurrence_count` (1→2) + audit line. Quirk: requires rich flag, not bare `remember`.
- **PR2**: USER persona over cap condenses correctly, never strands to `fragments/`.
- **PR3**: `trust_score` column migration is non-destructive. (Score value only suite-covered; no direct readout.)
- **PR4**: No-`--to` flag promotes route to 3 files. Quirk: requires `init-user-tier` first.
- **PR5**: Zero-width Unicode in `cmk remember` exits with code 2, writes nothing. Quirk: bare form triggers exit 2.

Three layers flagged **MANUAL**: gate logic, spoken mention, MCP path (CLI cannot assert these).

**Why:** This is the baseline gate for v0.4.3; documents what was verified before release and establishes the pattern for future gate iterations.

**How to apply:** When designing v0.4.4 cut-gate, use PR1–PR5 as the minimum baseline and reference these quirks in new checks.
