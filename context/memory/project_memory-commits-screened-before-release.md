---
id: P-2VC4JB3Y
type: project
shape: State
title: Memory Commits Screened Before Release
created_at: 2026-07-10T09:50:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 28b80190f74ef7785d8c08d32a86695098f38b3f652ac81a1379001809ecdfa8
related: [release-workflow-for-lh8ppl-claude-memory-kit, kiro-hook-activation-and-git-commit-cycle, plugin-install-and-bootstrap-are-separate-one-time-steps]
---

- Dogfood memory changes (context/ directory) must be screened before commit
- Screening checks: name-validator compliance + gitignore violation detection
- Memory commit is part of pre-release checklist, before tagging and pushing
- This ensures documentation/memory is in sync with the release version

**Why:** Prevents orphaned uncommitted changes after release; keeps memory system trustworthy and auditable

**How to apply:** Include memory screening and commit as a required pre-release verification step; apply rules per ADR-0018
