---
id: P-BC7LXZSQ
type: project
shape: Plan
title: 'Task 246 Phase 2: Redirect Capture-Hook Bins to Root Resolver'
created_at: 2026-07-22T08:27:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 49784e9f1b70af15b45f3ab2032db19ec1b4b94ccf54e6a8807c9817284b9dd3
related: [misplaced-memory-files-recovered-to-root-context, 177-file-incident-structural-prevention-now-in-place, kiro-hook-activation-and-git-commit-cycle]
---

The actual Task 246 fix involves updating 8 capture-hook bins to point at the root context/memory/ resolver rather than nested paths. This prevents recurrence of the misdirection that necessitated recovery work.

**Why:** Recovery cleaned up misplaced files, but the root cause is that capture logic directs memories to wrong locations. The fix must redirect the 8 hooks.

**How to apply:** This is the code-level fix that completes Task 246, safe to proceed after recovery/cleanup work is confirmed.
