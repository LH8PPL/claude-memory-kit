---
id: P-TEBXURXZ
type: project
title: Global `cmk` Artifact Version and Template Sync
created_at: 2026-06-23T04:47:17Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d94c710ae2223ba1c263edaec12272f931a47732f4acb7a3797d8fb22de1a67f
related: [post-d194-artifact-update-workflow-for-kiro-trust-fix-verifi, cut-gate-must-test-published-artifact-not-repo-code, updating-cmk-requires-re-running-bootstrap-on-project-files]
---

The global `cmk` package bundles a skill template that is used when running `cmk install`. The currently-installed global `cmk` is pre-D-195 and contains the old (broken) SKILL.md template. Reinstalling using an outdated global will scaffold the outdated template, not the fixed version from main. To get the latest, either rebuild the global artifact (`npm pack` + reinstall) or manually copy the fixed SKILL.md files from main into the target directory.

**Why:** The global artifact and main branch can drift, so a fresh reinstall does not guarantee you get the latest template. This sync lag is especially problematic when testing fixes in a gate or test environment.

**How to apply:** Before reinstalling skills in a test environment, verify the global `cmk` is up-to-date. If outdated, either rebuild it first or manually copy the fixed files. Document this as a known sync lag until a full artifact rebuild is cut.
