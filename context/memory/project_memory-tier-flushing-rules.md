---
id: P-T2PBQP3Y
type: project
shape: Timeless
title: Memory Tier Flushing Rules
created_at: 2026-08-02T07:56:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2c480143d56f0bad0bbd4288160c671e63cc7777a6ab4f4c3155a0e9ab2e9ac5
related: [cleanup-discipline-no-debugging-artifacts-in-repo, git-fixture-byte-normalization-verification, three-tier-memory-architecture]
---

- All memory tiers are flushed together (whole-tier model)
- Gitignored tiers must NOT be staged to git (explicit constraint)
- Pre-screen for cleanliness before committing memory

**Why:** Prevents accidental commit of machine-local memory; maintains segregation between committed and local-only storage

**How to apply:** When flushing, verify whole-tier is flushed, confirm gitignored tiers excluded, pre-screen before git commit
