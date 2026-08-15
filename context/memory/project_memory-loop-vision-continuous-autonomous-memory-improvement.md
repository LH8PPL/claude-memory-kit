---
id: P-75XLTRDa
type: project
title: Memory-loop vision — continuous autonomous memory improvement
created_at: 2026-06-29T07:19:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c5b412f32432237074461e4f7948db9144ad44657cee9b4c07dde45ce60588e7
related: [task-179-umbrella-task-for-memory-improvement-sequencing, hermes-is-skill-library-curation-not-memory-self-improvement, letta-precedent-evidence-for-tasks-149-95]
---

- User envisions a **background loop** that periodically re-reads and improves memory files through:
  - Pattern detection across sessions
  - Merging/sharpening related facts
  - Generating new insights
  - Improving skills/behavior docs from accumulated corrections
- Not just data cleanup/pruning; **insight-generation is the core output**
- User has observed reference implementations: letta's sleeptime agent, Anthropic Dreams

**Why:** This frames a core architectural ambition for the kit — memory should improve autonomously between sessions, not just accumulate stale data

**How to apply:** Scope as research/ADR task once new survey links arrive. Examine how existing projects implement memory-rethinking patterns (e.g., letta's `rethink_memory`). This may unify Tasks 95 (re-curation) + 55 (behavioral patterns) + 177 (correction-trained docs).
