---
id: P-MB6NX5EP
type: project
title: Task 151.3 bridge answer cite-and-sum
created_at: 2026-06-29T21:20:30Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 23137c34cb5b84d817fc8f7537cc38e0a4a1ada63ad0257314c4059e37e243d5
related: [trait-recurrence-gating-design-151-3]
---

Task 151.3 BRIDGE ANSWERED (workflow wv99dhd5d, 5/5 unanimous, saved to C:/cut-gate-backups/task-151-design-restructure/bridge-study-151.3.json.bak). VERDICT: arithmetic counts+selects; the LLM NEVER counts recurrence (rejects Option A). WIRING for 151.3 (B-strict via fact-id citation): the auto-persona classifier emits PERSONA CANDIDATE lines that ALSO cite source_fact_ids (the facts it synthesized the trait from) — NOT a recurrence=N number. Code resolves those ids against the project corpus, sums their real recurrence_count (from 151.1), and gates promotion on that sum >= threshold (PROMOTE_THRESHOLD=3 from heat.mjs), replacing the form-gate at auto-persona.mjs:534. Validate cited ids (reject hallucinated/unresolvable). Honest caveat: the sum is deterministic but the LLM chooses which facts feed the trait (acceptable — grouping is synthesis). Alternative if a fact-clustering primitive exists: cluster-first-then-synthesize-per-cluster (3/5 majority, strictly more faithful) — but we have no embedding-cluster primitive pre-LLM, so cite-and-sum is the pick. NEXT: TDD 151.3 — extend PERSONA_CANDIDATE_RE + parsePersonaCandidates for source_fact_ids, add a resolveRecurrenceSum helper, swap the gate.
