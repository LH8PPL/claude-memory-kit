---
id: P-DDRMSBPC
type: project
title: Task 167 — drop HC-10 doctor check, keep only the free auto log
created_at: 2026-06-25T20:15:34Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: a23896a41dcff22445ead83d556778adebb5aee7849aa1e0c024fea6f83a9bf0
related: [a-health-check-behind-a-command-does-not-surface-a-silent-fa, hc-10-proactive-dead-cron-detection-question-7, re-review-post-skill-review-fixes-before-merge-the-last-edit]
---

Task 167 detectability (Q7) settled — CUT the cmk doctor HC-10 from required scope. The user: 'its just another redundancy, only high-end users will do that.' Correct: the automatic heal (Q4) already fixes the real problem; HC-10 only TELLS you about a dead cron (fixes nothing), it's OPT-IN (user must run cmk doctor — regular users never do), and it targets power users who can self-diagnose anyway = effort on the audience that needs it least. 167.C shrinks to just the FREE AUTOMATIC half: a WARN line in lazy-compress.log when skipping/healing (zero user surface, it's the audit trail — exactly the log that let us diagnose THIS bug). HC-10 is dropped to optional/later (add only if a power user actually asks 'is my cron firing'). Principle reinforced: a redundant opt-in check aimed at users who need it least is ceremony, not a fix — the automatic heal that helps EVERYONE is the deliverable.

**Why:** Grilling Task 167 Q7. I proposed a proactive cmk doctor HC-10 for dead-cron detection; the user cut it as redundant ceremony aimed at the wrong audience (only power users run doctor; the heal already fixes the real problem). Keeps 167 focused on the automatic fix that helps everyone, not an opt-in warning for the few who need it least.

**How to apply:** 167.C = the WARN log line in lazy-compress.log only (free, automatic, zero user surface — the audit trail). Do NOT build a cmk doctor HC-10 as part of 167; defer it to optional/later, add only on real power-user demand. General rule: prefer the automatic-helps-everyone fix over an opt-in check that only the self-sufficient will ever run.
