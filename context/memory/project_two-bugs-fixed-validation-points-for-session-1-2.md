---
id: P-GUWLUBBT
type: project
title: Two Bugs Fixed—Validation Points for Session 1 & 2
created_at: 2026-06-11T10:12:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5b2c9c75e122d10495719914f2edffe3d142cb2b
related: [release-cut-gate-validation-pattern, skill-composition-pattern-scaffold-allow-list-must-be-update, kiro-auto-extract-trigger-works-write-unproven]
---

During testing, two issues were identified and fixed in the PR being merged:
1. **Dedup bug**: observation_count values were suppressed on turns where facts were stated (B1/B2 evidence), preventing proper logging
2. **Memory-search skill issue**: showed a permission prompt on first recall when it should not have prompted
Validation approach after merge:
- **Session 1, mid-run**: check `context/sessions/*.extract.log` for `observation_count > 0` entries on turns where facts were stated without saying "remember"
- **Session 2, first recall question**: memory-search skill should invoke and answer with no permission prompt

**Why:** These were bugs causing test suite failures. The PR fixes both; Session 1 & 2 testing confirms the fixes work correctly.

**How to apply:** After merge, pull, rebuild, then run Session 1 and Session 2 with these specific validation points in mind.
