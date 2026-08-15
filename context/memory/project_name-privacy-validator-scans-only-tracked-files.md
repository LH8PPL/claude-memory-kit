---
id: P-K6P2LBE3
type: project
shape: Timeless
title: Name-Privacy Validator Scans Only Tracked Files
created_at: 2026-07-03T20:12:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 62c7fe94cfc5764c984d5127632962f07eb55d02d0e97037447c02225c570d36
related: [whole-tier-flush-rule-for-context-directory, memory-commit-workflow-hygiene-privacy-validation, memory-tier-flushing-rules]
---

The local pre-commit name-privacy validator runs against the git index (tracked files), not the working directory. Files created but not yet staged with `git add` bypass the local check and fail only when pushed to CI.

**Why:** Avoids wasted CI cycles and confusing "passes locally, fails remotely" failures during context/docs commits.

**How to apply:** When committing context/ or docs changes, stage files with `git add` *before* running validation, not after — the validator must see the staged state to catch new files.
