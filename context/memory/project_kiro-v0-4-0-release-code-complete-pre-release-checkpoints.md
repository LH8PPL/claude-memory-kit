---
id: P-XT9KMHaA
type: project
title: Kiro v0.4.0 Release — Code Complete, Pre-Release Checkpoints
created_at: 2026-06-21T13:51:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f4e6ab87658165fcfec2d27470679ff86c392131538be6730769f76976a6eaac
related: [plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes, v0-5-2-code-complete-pr-286-pending-ci-merge, resume-v0-3-1-cut-gate-2-bugs-found-fixed-pr-179-in-flight]
---

All code merged to main (PR-1 #212, PR-2 #213).

**Release gates passed:**
- All 5 review findings (I-1/I-2/I-3, M-1/M-2) fixed in-line
- Stress 5/5; CI green on 3 OSes + SonarCloud + security scanners
- Two pre-existing flakes root-caused (not product bugs)

**Release checkpoint:** Manual "batched 50.M live-test" — one real Kiro session verifying both surfaces fire together: IDE `.kiro.hook` capture + CLI agent + default-agent resolution. Sandboxed with `MEMORY_KIT_AWS_DIR` + `MEMORY_KIT_USER_DIR`.

**Why:** Ensures IDE and CLI surfaces work together before shipping; user's stated release requirement.

**How to apply:** Run live-test when code complete; if pass, cut v0.4.0 with `npm run release -- minor` then user pushes tag.
