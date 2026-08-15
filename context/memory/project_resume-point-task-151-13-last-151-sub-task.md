---
id: P-PKQY4FNJ
type: project
title: Resume point Task 151.13 (last 151 sub-task)
created_at: 2026-06-30T09:26:19Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 4f35e4f1bbb5305f0ba0bd268fa8e069ead18f62675dc0ab58793a246c5ef1ba
related: [resume-point-task-151-7-trust-update-rule, resume-point-v0-4-3-pre-merge-code-complete, resume-point-task-151-4-move-2-demote-not-evict]
---

RESUME POINT (v0.4.3, branch task-151-recurrence-promotion): Task 151 is 12/13 sub-tasks DONE + committed + pushed (last commit 67f3b44). Full suite 2468/2468. DONE: Moves 1-4 complete — 151.1-151.3 (recurrence gate, cite-and-sum), 151.4-151.5 (demote-not-evict + value-ordered sweep) + the 151.5 sweep re-eval RESOLVED (D-238: keep the enum, trust_score is floor/protection not a sweep driver), 151.6-151.8 (trust_score field + asymmetric update rule + 3 passive signals: dampen=overlay, reinforce=durable recurrence-term-in-seed — D-237), 151.9 (offline topic-router, fixes Hole C), 151.10 (silent auto-drain verified), 151.11 (optional warmth mention), 151.12 (supersede mark-not-delete + dampen on every path, closed the deferred merge-path gap). NEXT = 151.13 (the LAST 151 sub-task): tests + migration + cut-gate — (a) the 5 design done-criteria (recurrence-not-phrasing / cold-open-reaches-promoted / explicit-spreads / trust-moves-passively / automatic-path), (b) schema migration for existing installs (recurrence_count frontmatter defaults + index trust_score backfill on reindex — both already self-heal via reindex; verify), (c) the Hole-A + Hole-B regression repros as cut-gate stages. THEN 70.4 (Unicode/zero-width/bidi injection block in poison-guard.mjs) + 74 (verify re-inject-after-compaction works + test + ADR-0006). THEN pre-merge: skill-review the WHOLE 151.x diff (53f→67f3b44) + stress 5/5, then merge to main + cut v0.4.3 (the user's outward step). Decisions D-229 through D-241 in DECISION-LOG. PAUSED at maintainer request after 151.12.
