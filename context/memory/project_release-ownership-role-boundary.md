---
id: P-U5HYTaHY
type: project
title: Release Ownership Role Boundary
created_at: 2026-06-30T20:08:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7abdb28dd27b23e6a2e46e751d64bd50bd59599498bc140ecc63e3726dadaf02
related: [release-workflow-with-cut-gate-testing, standing-outward-step-rule, release-handoff-pr-creation-vs-merge]
---

- Merge to main, release cut (version bump), and npm/GitHub publish are **user-driven** actions
- Assistant provides step-by-step instructions and confirms all release gates passing
- Assistant does NOT execute merge, publish, or push tags
- Maintains clear responsibility and traceability for production changes

**Why:** Ensures transparency and user control over outward-facing actions (npm publish, GitHub Release, git tags); prevents accidental commits to wrong branch or publishing wrong version

**How to apply:** When release ready, provide shell commands and gate review; user executes all git/npm commands; assistant reviews outputs and confirms success
