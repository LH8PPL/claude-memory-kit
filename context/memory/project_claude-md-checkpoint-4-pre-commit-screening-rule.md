---
id: P-NRBD56HF
type: project
title: 'CLAUDE.md Checkpoint #4: Pre-commit Screening Rule'
created_at: 2026-07-02T08:33:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: db02dd691b172df954972da1171b6d121ec4bcbd1d2d6ae14202be6ec6b6d0d8
related: [task-71-pre-commit-hook-backlog, task-boundary-memory-flush-rule, binding-rule-readme-line-for-user-facing-features]
---

Before staging `context/` to public repo, scan new fact files for secrets/home-paths. This is a binding rule enforced at commit time (complement to Poison_Guard write-time screening).

**Why:** Ensures no credentials or absolute home paths are published in fact files

**How to apply:** Apply this rule at every dogfood flush; can be automated by Task 71 hook
