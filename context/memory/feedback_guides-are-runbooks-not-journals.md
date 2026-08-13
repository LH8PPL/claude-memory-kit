---
id: P-BQJV9SEF
type: feedback
title: guides-are-runbooks-not-journals
created_at: 2026-06-18T06:37:28Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 6bdb57ab86b6440ba1d2492a8e098fd1aa6cd7b3f6f6f66a960bf2f1247827f9
related: [follow-the-doc-procedure-route-dont-narrate, cmk-permission-prompt-only-on-cd-compound-d-80-edge, decisions-md-is-write-only-for-ai-recall-not-in-any-recall-d]
---

Guides/runbooks (docs/process/cut-gate.md, SETUP.md, HEALTH-CHECKS.md) are things the user RUNS for a manual live test — keep them terse, scannable, instruction-only: command → expected result → PASS/FAIL. Do NOT write build rationale / decision-log narrative into them (the gap that motivated a stage, "as of vX.Y" history, precedent, rule citations like per-D-N). That rationale goes to DECISION-LOG.md (the why), design.md (the how), or the task entry.

**Why:** The user caught this twice — "why is my cut-gate guide becoming your journal? this is not the first time." Mechanism: right after implementing, the build's reasoning is hot in context and I dump it into whatever file is open instead of routing each kind of content to its source-of-truth home. The guide was open, so narrative bled into the one file whose job is to be runnable. Compounds the scannable-docs preference (he already reformatted the cut-gate guide for being "very hard to read").

**How to apply:** When adding a stage/step to a guide, write ONLY the command(s), the expected result, and PASS/FAIL — plus at most one terse "Note (vX.Y): …" line if a behavior changed. If you feel the urge to explain WHY a stage exists or what was missed before, stop and put it in DECISION-LOG.md / design.md instead. Before saving any edit to a docs/process/ or root *.md guide, re-read the diff and delete any sentence that narrates reasoning rather than instructing action.
