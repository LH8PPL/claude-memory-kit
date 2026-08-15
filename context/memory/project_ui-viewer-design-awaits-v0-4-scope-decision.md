---
id: P-TMC4EMRK
type: project
shape: State
title: UI Viewer Design Awaits v0.4 Scope Decision
created_at: 2026-07-23T08:30:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce016c7eb9bb196b34e700a75e31b428ad8f40e7569d3a622ea9c06910ef7098
related: [two-phase-viewer-rollout-obsidian-v0-6-3-kit-viewer-v0-6-4, task-255-design-grill-questions-queued, cmk-view-purpose-and-headline-use-cases]
---

- **Background**: cmk v0.1.0 shipped a `cmk view` stub. On 2026-06-11 (D-121), user decided to remove the stub but preserve the viewer idea as a v0.4 design-first product question.
- **Current state**: Design session never happened; parked ~6 weeks (since 2026-06-12).
- **Benchmarks**: claude-mem (77k stars, Obsidian-like vault UI), Pulse (15.8k stars, localhost AI-state dashboard).
- **Three sequencing options**:
  1. Obsidian vault compatibility (cheap, free graph/backlinks; requires user install; can't render kit-specific concepts like trust tiers, supersession chains)
  2. Own viewer (M–L build; kit-owned; zero dependencies; works for non-developers; can render all kit-concepts)
  3. Both, sequenced (ship Obsidian now to test appetite "do people look?"; defer own-UI as v0.4 design question)

**Why:** Task 254 foreclosed option 2, which may not be the user's call. Clarifies that all three paths remain open and their tradeoffs.

**How to apply:** When resuming viewer work, recall D-121's intent to keep the idea alive. Use Obsidian adoption as signal for whether to invest in own-UI design.
