---
id: P-64LE9CWJ
aliases: [P-64LE9CWJ]
type: project
shape: Plan
title: Viewer Page HTML Redesign — File Attachments & Priorities
created_at: 2026-08-05T18:36:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c251b29df63e1521478702144ea56e498e83ac8f790845fce5814ff60abc3cb3
---

Full attachment list for redesigning `packages/cli/src/viewer-page.html` using Claude's design tool, sourced from `docs/design-brief.md`:

**Required files:**
- `packages/cli/src/viewer-page.html` — the file to redesign
- Current screenshots (all 4 tabs, light + dark): `after-facts.png`, `after-facts-dark.png`, `after-graph.png`, `after-graph-dark.png`, `after-health.png`, `after-decisions.png`, `after-fact-detail.png`
- Reference designs: `claude-mem-card-variants.png`, `everos-dash.png`
- Direction memo: `docs/research/2026-08-04-viewer-visual-direction-memo.md`

**If attachment limit enforced, keep in priority order:**
1. `viewer-page.html` (essential)
2. Direction memo (the direction)
3. `after-facts.png` + `after-graph.png` (main landing, most critical visuals)
4. `claude-mem-card-variants.png` (reference)
5. Everything else (dark variants, other tab screenshots)

Drop from the bottom up if you hit a limit.

**Critical note:** Dark mode screenshots essential—memo specifies dark should be designed (not inverted CSS).

**Tool configuration:**
- Use code toggle `</>` to output HTML code, not canvas mockup
- Design System selector can override direction; disable if conflicting
- If tool defaults to mockup, redirect: "output the complete HTML file as code, not a design canvas"

**Why:** Previous guidance listed only 5 files; this is the complete checklist (7 screenshots + 2 refs). Attachment priority prevents re-iteration if tool enforces limits. Dark mode is a designed state (not CSS inversion). Tool quirks (canvas vs code output) are non-obvious and cause wasted iterations.

**How to apply:** Use this checklist and priority order each redesign session. Apply tool config notes at attach/preview stage to avoid wrong output format.
