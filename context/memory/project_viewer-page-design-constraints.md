---
id: P-aKLSSTP2
aliases: [P-aKLSSTP2]
type: project
shape: State
title: Viewer Page Design Constraints
created_at: 2026-08-05T18:22:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cd8bdf6056d8ed47f1cac0a4f5ee593249e15485a340f920cceb830cfec23205
related: [design-spec-24-1-2-muted-text-contrast-target]
---

- **Colour**: 3-colour cap (accessibility requirement; prevents CVD separation failures; NOT negotiable)
- **Pattern**: trust-as-rim-arc is accessibility arithmetic, not aesthetic choice
- **Compliance**: WCAG AA with contrast computed from served CSS
- **Validation**: Validator-checked contracts (zero dependencies, no HTML-parsing sinks, live-verify 25/25)
- **CSS**: Single `<style>` block in `packages/cli/src/viewer-page.html` with two token blocks (light, dark)
- **Contract spec**: `specs/design.md §24`

**Why:** These constraints are non-negotiable for accessibility and compliance. Treating them as given (not aesthetic choices) ensures the designer optimizes within bounds rather than trying to redesign around them.

**How to apply:** Always reference these constraints when briefing design work. Validate final output against them before shipping.
