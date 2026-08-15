---
id: P-JGGA2CKY
type: project
shape: Timeless
title: Distinction Between Deferred and Committed Work
created_at: 2026-07-08T13:20:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 377c2f3d0d68c0a9e76fb88aa653f1da5b4962aea05df2d80792d54a185b5de6
related: [anti-stalling-directive-the-user-2026-07-23-we-had-it-for-6, sonarcloud-then-in-object-false-positive-schema-fields, d-24-constraint-patch-releases-skip-d-248-backlog-sweep]
---

- "Might be useful someday" → use D-248 discipline (named triggers, gate-checked when condition fires)
- "Breaks the kit's central promise" → committed lane + version (immediate fix, not deferred)
- Example: distill starvation with false-positive health check is the latter

**Why:** Conflating the two led to premature deferral; silent promise-breaking should not be gated.

**How to apply:** When filing a bug/issue, ask: does this break a core guarantee? If yes, commit to a version/lane immediately. If no, consider a trigger-gated task.
