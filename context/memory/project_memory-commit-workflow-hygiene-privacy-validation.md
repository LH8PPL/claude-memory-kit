---
id: P-U3JGW7WP
type: project
title: Memory Commit Workflow — Hygiene & Privacy Validation
created_at: 2026-06-30T06:14:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 83533d95588bb487264f949bc6cd4d5f68cb66d9a7eb618eb47c6bab368e14a4
related: [public-repo-memory-policy, memory-tier-flushing-rules, name-privacy-validator-scans-only-tracked-files]
---

79 accumulated context files (75 fact files + MEMORY.md/DECISIONS.md/INDEX.md) committed as separate chore commit (3602f6c), distinct from code commits to preserve signal clarity. Pre-commit: name-privacy validator confirms no home-path/secret leaks. Gitignored tiers (sessions/, transcripts/) correctly excluded from staging.

**Why:** Memory system integrity requires clean signal separation, privacy assurance, and gitignore discipline.

**How to apply:** On future memory commits: (1) run privacy validator, (2) stage only context/ files, (3) commit as `chore(memory)` separate from code, (4) verify gitignore tiers not staged.
