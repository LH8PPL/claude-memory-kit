---
id: P-2K29UJKN
type: project
shape: Preference
title: Durable-State-First Principle
created_at: 2026-07-27T09:06:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0ced901b4e75869130e42e92a29714b1f4292c794f122dda8d7c4585a43b6757
related: [356-dispatch-agent-killed-fix-batch-does-not-auto-start, version-snapshot-in-recent-md-guards-against-cross-session-a, resume-fact-convention-capturing-uncommitted-code-intent]
---

Keep work external and committed, not stranded in the working tree. When pausing, commit and push to the branch so the next session inherits clean, durable state.

**Why:** Enables smooth pause/resume cycles without re-deriving state between sessions

**How to apply:** On pause, commit + push all pending work. On resume, start from the branch state, not local working tree.
