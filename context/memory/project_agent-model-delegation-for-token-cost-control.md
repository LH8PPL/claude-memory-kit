---
id: P-SSP653KU
type: project
shape: Timeless
title: Agent Model Delegation for Token Cost Control
created_at: 2026-07-22T15:53:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ddae1bdfd0a66a3409390977c2994b6892f4d75ef84771554ecb39b7c6d50c44
related: [three-tier-model-delegation-pattern]
---

Claude Code supports model delegation via Agent tool in three patterns:
1. **Ad hoc per-call**: `model: "opus"` override in Agent invocation; subagent tokens bill separately, transcript stays local
2. **Standing setup**: custom agents in `.claude/agents/*.md` with `model: opus` in frontmatter
3. **Workflows**: `agent(prompt, {model: 'opus'})` syntax in Workflow scripts

**Critical caveat**: token savings only materialize if bulk work (file reading, test runs, mechanical edits) is actually shifted to delegated agents. If delegation just adds process overhead, no savings.

**Recommended model split for this repo**:
- Fable 5: orchestration, design, review, verdicts
- Opus 4.8: implementation, test-writing
- Haiku 4.5: mechanical scans, grep-scale sweeps

**Why:** Enables cost optimization while preserving orchestration quality; subagent isolation prevents context bloat

**How to apply:** Define agent definitions in `.claude/agents/` for common task types with appropriate model assignments; validate that delegation shifts work rather than adding overhead
