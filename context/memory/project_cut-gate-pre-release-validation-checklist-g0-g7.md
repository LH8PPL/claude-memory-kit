---
id: P-2CFEBV9Y
type: project
title: Cut-Gate Pre-Release Validation Checklist (G0-G7)
created_at: 2026-06-16T09:08:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3370fe78c539bbe44322d6b3ca858a123c229c65958f5940893b6275cc5337a8
related: [pre-session-1-gate-procedure-v0-4-1, cut-gate11-pre-session-verification-checklist, claude-memory-kit-health-check-suite-hc-1-through-hc-9]
---

The kit's pre-Session 1 validation uses seven named gates:
- **G0**: Version check (`cmk --version` → v0.3.2)
- **G1**: Install + health (`cmk install --with-semantic` + `cmk doctor` → 5 pass, 0 fail, ≤3 skip)
- **G2**: Memory-write skill safety (no Edit/Write, never hand-edit gate enforced)
- **G2b**: Memory-search skill read-only + `context: fork` isolation
- **G3**: CLAUDE.md slim (only invariants + skill pointer, no cruft)
- **G4**: Scaffold clean (no template vars, username, dates; hooks/allow-list correct)
- **G6**: MCP server registered (`cmk mcp serve` in .mcp.json, `mcp__cmk__*` in settings.json)
- **G7**: `--with-semantic` defaults to hybrid model

Later sections add **FQ1** (FTS5 fix, §4 post-C-probes) and **DJ1/DJ2/DJ3** (digest + DECISIONS.md, §4c).

**Why:** These gates catch breaking changes, misconfiguration, and integration regressions before user-facing Session 1. They form the kit's cut validation checklist.

**How to apply:** When validating a cut build, run all G-gates in order and confirm pass/fail. Expect all G-gates and later FQ/DJ gates to pass before proceeding to Session 1.
