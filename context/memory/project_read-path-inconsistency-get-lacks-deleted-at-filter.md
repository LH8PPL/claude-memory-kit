---
id: P-YFUW6ABE
type: project
title: Read Path Inconsistency — `get` Lacks Deleted_at Filter
created_at: 2026-06-16T11:20:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f7742c6f928db3e9ab89cf6c187a07a5557605aa8362c74713ca7efff87eb318
related: [d-163-invariant-agent-must-never-see-forgotten-facts, automatic-recall-never-reads-tombstones-recovery-is-human-on, f-7-spec-vs-code-mismatch-tombstone-reading-in-cmk-get]
---

- `get` returns "not found" for tombstoned facts (live-only behavior)
- However, `get` achieves this safety only because forget prunes the DB row, not by active filtering
- Other verbs (`search`, etc.) actively filter on `deleted_at IS NULL`
- `search` already has an `--include-tombstoned` flag to explicitly opt-in to reading deleted facts
- This inconsistency creates latent fragility: `get` works today only by accident (pruning), not by design

**Why:** Flagged during fact-probing work as a gap: the CLI and MCP surfaces have different coverage, surfacing this inconsistency. If recovery features are added, this pattern should be fixed.

**How to apply:** If recovery is added, use `get --include-tombstoned` (mirrors search's existing pattern) rather than overloading default `get` behavior. Keeps the API consistent: live-only by default, explicit opt-in to read deleted.
