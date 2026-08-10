---
id: P-46FTFCCW
type: project
title: architecture review priorities and the persona-routing-into-151 fold
created_at: 2026-06-25T14:22:29Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: da871c45ac06f3c42fc662d8abc6be3cea0758cca02b768e6c6f652612e16993
related: [compaction-state-module-v0-4-1-core-architecture-refactoring, task-167-compaction-state-module-interface-two-methods-rich, kiro-has-four-install-surfaces-not-three-the-user-s-correcti]
---

Architecture review (2026-06-25) outcome: #1 Compaction-State module = v0.4.1 (it IS Task 167's implementation shape — build the deep module, 167.A/D/F land as its callers). #2 persona-routing seam = FOLD INTO Task 151 (v0.4.2), do NOT do standalone — 151 already rewrites PERSONA_CONFIDENCE_RULE + promoteCandidatesToUserTier wholesale, so a v0.4.1 refactor would be churn; the shared seam becomes part of 151's redesign. #3 bullet-lookup deepen = standalone low-risk, no collision. #4 (lazy-compress dispatch) folds into #1; #5 (scratchpad-sweep) deferred (one adapter = hypothetical seam).

**Why:** The /improve-codebase-architecture review found 6 deepening candidates. #2 (persona-routing) overlaps directly with Task 151's planned rewrite of the persona-promotion surface — doing it standalone in v0.4.1 would refactor code 151 rewrites in v0.4.2. The user agreed #1/#2/#3 are all worth doing but #2's timing must align with 151 to avoid churn.

**How to apply:** Build #1 as the v0.4.1 compaction-state module (= Task 167.A's last-success marker). When Task 151 does the persona redesign, extract the shared persona-routing seam (PERSONA_CONFIDENCE_RULE + parsePersonaCandidates + confidence-to-trust) as part of that rewrite, not before. #3 can ride v0.4.1 or its own patch. Re-research #4/#5 before committing.
