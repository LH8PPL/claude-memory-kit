---
id: P-RCFJSFHD
type: project
title: Seven Novel Signal Types for Memory Learning (27-System Survey)
created_at: 2026-07-01T20:24:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c0ad92e1fedec52db87202663457641443a51eeade94fbc6c0874b1b4a3c43f5
related: [high-impact-signals-to-prioritize-for-implementation]
---

- **Peer-disagreement / group-consensus** (A-MemGuard) — a recalled fact that disagrees with co-retrieved neighbors is suspect; set-level anomaly detection, oracle-free.
- **Weighted blame-attribution** (SkillAdaptor) — when a turn fails, split responsibility across all recalled memories; graded credit assignment, oracle-free.
- **Explicit dead-end / route-closure veto** (Negative Knowledge) — a fact typed as "do NOT try this" (negative constraint), not a fact-that-happens-to-be-wrong.
- **Negative-case-as-exemplar** (Memento, REMEMBERER) — retain failures as labeled "avoid this" anti-patterns; failures have value as cautionary examples, not just deletion.
- **Held-out replay gate** (SkillOpt) — validate a memory edit against past tasks BEFORE writing; "does this change improve outcomes?" gate.
- **Rejected-edit buffer** (SkillOpt) — remember own rejected changes to avoid re-proposing them; learn from own bad ideas.
- **Learn a "how-to-remember" meta-model** (MCMA) — update a separate model of memory structure, not the memory's rank itself.

**Why:** The 27-system survey (18 wave-1 + 9 wave-2) discovered these by analyzing how systems implement learning. They expand the kit's signal portfolio beyond pairwise contradiction and tool-result feedback. Several (peer-disagreement, negative-exemplar) are oracle-free and automatic.

**How to apply:** Use this list to populate ADR-0017's Decision on available signals. Prioritize peer-disagreement and negative-exemplar as near-term builds (cheap, high-value). Flag blame-attribution and replay-gates as heavier (require recall-tracking infrastructure).
