---
id: P-WG2UHVZX
type: project
title: Resume point Task 151.7 (trust update rule)
created_at: 2026-06-30T07:18:00Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 2f4e2db4ad5547f2fc5b341d9dff2e8502fb444ba958406bf20982a226f48790
related: [resume-point-task-151-13-last-151-sub-task, resume-point-v0-4-3-pre-merge-code-complete, resume-point-task-151-4-move-2-demote-not-evict]
---

RESUME POINT (v0.4.3, branch task-151-recurrence-promotion): 151.1-151.6 DONE + committed + pushed (last commit 33c18f8). Full suite 2434/2434. Move 1 (recurrence gate) + Move 2 (demote-not-evict 151.4 + value-ordered sweep 151.5) + Move 3 START (151.6 trust_score field + source-based init in new trust-score.mjs) all landed. NEXT = 151.7: the trust_score UPDATE RULE in trust-score.mjs — asymmetric +0.1 reinforce / -0.15 dampen, floor 0.05 (already TRUST_SCORE_FLOOR), NO time-decay of stored value (decay is search-ranking only); add updateTrustScore(current, event) pure fn; Done-when = unit-tested deltas, floor holds, asymmetry (failures dampen faster) proven. THEN 151.8: wire the 3 PASSIVE signals to those deltas (contradiction-queue hit -> dampen; superseded_by set -> dampen the old; 151.1 re-surface/restatement -> reinforce), zero ritual (no cmk command). THEN the 151.5 sweep RE-EVAL (now binding per task entry: consume the evolved trust_score in consolidate + truncateTierToBudget, replacing the trust-enum proxy — markers // 151.6: re-evaluate at both sites). THEN 151.9-151.13 (routing/auto-drain/mention/supersede/tests+cut-gate). THEN 70.4 (Unicode injection) + 74 (re-inject-after-compaction). Pre-merge: skill-review the whole 151.x diff + stress 5/5, then merge to main + cut v0.4.3. Note: stress harness flaked once (all-suites-fail-to-load, transient vitest pool corruption) — re-run fresh clears it; npm test is the authoritative gate. PAUSED at maintainer request after 151.6.
