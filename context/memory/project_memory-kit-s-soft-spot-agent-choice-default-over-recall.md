---
id: P-P3Ta6QVX
type: project
shape: State
title: 'Memory Kit''s Soft Spot: Agent-Choice Default Over Recall'
created_at: 2026-07-15T19:22:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d2b4d54b31d590ad7f43ca20c65a39938f916c04132964a3b9ab7d4891ee765b
related: [d-343-disposition-cmk-install-scaffold-refresh-bug-task-230, resume-fact-convention-capturing-uncommitted-code-intent, cmk-install-skips-existing-files-cannot-repair-stale-skills]
---

The kit's automatic layer is robust—it captured all session facts silently. However, agent-driven recall (via memory-search skill) is unreliable because the operator defaults to faster shortcuts (git, grep, direct source reads) rather than invoking recall. When recall WAS finally used, it immediately caught documentation drift (D-343 finding without Task 230 disposition). The real bottleneck is not the skill itself; it's reliance on operator judgment to use it instead of equivalently-fast alternatives. Design fix: make memory recall automatic, not operator-choice.

**Why:** Identifies the true weakness in the memory system—it's not technical, it's behavioral. The auto-capture layer works perfectly, but optional recall creates a soft boundary that operators will bypass when faster alternatives exist.

**How to apply:** When improving the memory kit, focus on making recall automatic or low-friction, not optional. Eliminate operator judgment from the recall path. Consider hooks or automatic queries instead of wait-for-agent-to-decide recall.
