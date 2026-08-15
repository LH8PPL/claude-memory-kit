---
id: P-STaW5V7W
type: project
title: 'IDE-to-Autonomous Spectrum: Same Loop, Richer Signals'
created_at: 2026-07-01T14:45:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3f1709f6518b8d05d0dd2549438a14d545837d62907331949c8431d97062dfa7
related: [ide-agents-and-autonomous-agents-are-on-dh5mucd6, claude-memory-kit-judge-as-the-per-host-adapter, automatic-oracle-free-quadrant-is-the-real-design-target]
---

IDE agents (Claude Code) and autonomous agents are not separate categories — they're points on a spectrum.

**The real axis: autonomy + signal richness** (a gradient, not a binary)
- Human-at-keyboard: few signals, human-driven
- Claude Code `/goal`: more signals (tool results, pass/fail, fact re-reads)
- Autonomous 24/7: most signals, automated

Same learning loop, same kit. Signal richness increases with autonomy; there is no categorical line.

**Why:** Claude was maintaining IDE-vs-agent as a binary to make the ADR cleaner. User correctly noted that Claude Code *is* an agent (multi-step tasks, `/goal` loops, tool calls) — the distinction was false. Collapsing it makes the ADR honest: a partial learn-loop ships today in the IDE; signal availability improves as the host becomes more agentic.

**How to apply:** When designing features, assume the loop is portable across hosts; signal types can migrate. Features for autonomous hosts aren't "future" — they're deployable to IDE hosts with matching signal availability.
