---
id: P-CQ4PVEBQ
type: project
shape: State
title: Three-Tier Model Delegation Pattern
created_at: 2026-07-22T15:56:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 898b2efa6f1b59e9cae12dbd54843bc2061bf77b44f35395255dd4d98a5e8737
related: [agent-model-delegation-for-token-cost-control, three-tier-agent-split-trial-on-task-233, d-390-multi-agent-architecture-active-configuration]
---

For this repo, adopting:
  - **Fable 5 (lead)**: plan, decompose, review verdicts, merges, trivial edits
  - **Opus (deep reasoning)**: implementation, tests, debugging, self-review
  - **Sonnet (mechanical)**: boilerplate, sweeps, doc formatting, fixtures
  
Tests go to Opus (not Sonnet) because test discipline here is deep-reasoning work. History shows shipped bugs hiding in test coverage (five exit doors, mutation guards, prompt assertions). Thus tests require skill-review: Opus writes + self-reviews, Fable arbitrates and holds merge. Subagent isolation keeps lead's context focused and optimizes per-model token cost.

**Why:** Prior shipped bugs hid in test discipline, justifying deep-reasoning (Opus) not mechanical (Sonnet) for tests. Matches model to task complexity. Reduces context bloat.

**How to apply:** Implement in `.claude/agents/` (three agent definitions). Trial on Task 233. Verify with adoption-verification template (quality parity + cost savings).
