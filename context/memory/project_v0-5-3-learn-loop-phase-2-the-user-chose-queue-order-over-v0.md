---
id: P-6WEaBE9M
type: project
shape: State
title: v0.5.3 = learn-loop Phase 2 (the user chose queue order over v0.6.0 on 2026-07-1
created_at: 2026-07-13T14:25:38Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 0e3871a9fcdbdb5f3ae8128379d9716976c8c028528b102d0ab23c3c2ea97ccb
related: [v0-5-3-roadmap-learn-loop-phase-2-confidence-gated-search-bl, v0-5-3-release-complete-ready-for-publication, session-state-at-pause-2026-07-20-pre-compact-v0-6-0-shipped]
---

v0.5.3 = learn-loop Phase 2 (the user chose queue order over v0.6.0 on 2026-07-13, after v0.5.2 shipped). Build order: Task 194 FIRST (confidence-gated SEARCH blend — BM25 + lambda*trust_score, confidence-gated, FACTS-only, judgments never rank; inject hot path stays enum-ordered per design 20.3 with a regression test; ExpeL survival gate routes floored-still-failing facts to review queue never silent-delete; anti-pattern conversion to typed avoid-this memory; amend design 20.3 IN the task; automatic-path: ranking improves with no manual command; live cold-open test: dampened fact ranks below healthy for same query). Then riders 209 (state-labeled recall — deterministic label projection current/superseded/expired/retracted, no LLM, labels-not-reranks), 211 (rule-based query state-view gate current/historical/transition/neutral, zero-LLM wordlist+negation-guard, the 4-view cut of the deferred 16.18 7-mode), 212 (memory-health dashboard from existing logs — writes-per-search/empty-search/redundant-write, report-only, IS 194 before/after instrumentation). All depend on Phase 1 (190-193, shipped v0.5.0). NOTHING STARTED YET. Governing docs: ADR-0017, design 20.3, SYSTEM-MAP section 6, D-252/D-308/D-309, the 2026-07-10-memory-research-sweep note (A-TMA for 209/211, AutoMem for 212).

**Why:** The next-version plan must survive the imminent auto-compact so the next session resumes v0.5.3 correctly without re-deriving it.

**How to apply:** At session resume: read Task 194/209/211/212 in specs/tasks.md + ADR-0017 + design 20.3 + the sweep note; branch task-194-search-blend off fresh main; TDD Task 194 first (it's the differentiator payoff), then the 3 riders which all touch the same search surface.
