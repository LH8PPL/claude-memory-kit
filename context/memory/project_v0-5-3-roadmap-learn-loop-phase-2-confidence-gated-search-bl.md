---
id: P-RaVEB3SL
type: project
shape: Plan
title: v0.5.3 Roadmap — Learn-loop Phase 2, Confidence-Gated Search Blend First
created_at: 2026-07-13T14:26:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cedf14087d95016c6a15b76054bc81df31234b48f270883139531c594cd538ba
related: [v0-5-3-learn-loop-phase-2-the-user-chose-queue-order-over-v0, v0-5-3-release-complete-ready-for-publication, post-v0-5-2-roadmap-decision-v0-5-3-or-v0-6-0]
---

- **Decision**: learn-loop Phase 2 chosen over v0.6.0 (day-one cmk import-sessions). See memory P-6WEaBE9M (commit dfebca5).
- **Task order**:
  - Task 194 FIRST: confidence-gated search blend (BM25 ⊕ λ·trust_score, facts-only, judgments never rank, inject hot-path enum-ordered per §20.3, ExpeL survival gate, anti-pattern conversion)
  - Task 209: state-labeled recall
  - Task 211: rule-based query state-view gate
  - Task 212: memory-health dashboard
- Tasks 209–212 all touch the same search surface
- Design references: ADR-0017, design §20.3, 2026-07-10 sweep note

**Why:** Plan committed to survive auto-compaction; exact resumption workflow eliminates re-derivation friction

**How to apply:** Next session: (1) read Task 194/209/211/212 + ADR-0017 + design §20.3 + 2026-07-10 sweep note; (2) branch task-194-search-blend off fresh main; (3) TDD Task 194. Quick resume: say "continue with v0.5.3"
