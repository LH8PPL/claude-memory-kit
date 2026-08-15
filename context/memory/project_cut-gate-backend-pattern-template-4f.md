---
id: P-FL2MY6EN
type: project
shape: Timeless
title: Cut-Gate Backend Pattern Template (§4f)
created_at: 2026-07-06T11:12:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5ea799d06a905be2edba27b8c1d3a1ec95d2c3280017675d7e6ccc1480a61296
related: [cut-gate-release-validation-guides-per-agent, cut-gate-structure-convention, claude-memory-kit-supports-3-ide-tool-agents]
---

The canonical `cut-gate.md` has a backend section (§4f) with this structure:
- BK1–BK4 checks (specific backend validation points)
- HC-11 check
- Banner statement
- Verdict line

All other cut-gate variants (cut-gate-cursor.md, cut-gate-kiro.md, cut-gate-kiro-cli.md) should replicate this same structure, substituting each agent's real CLI commands and paths.

**Why:** Structural consistency ensures maintainability and guarantees equivalent coverage across all agent guides.

**How to apply:** Use cut-gate.md §4f as the template. Adapt command examples to each agent (e.g., `cursor-agent -p` for Cursor, `kiro-cli chat` for Kiro CLI) but keep the check sequence and verdict format identical.
