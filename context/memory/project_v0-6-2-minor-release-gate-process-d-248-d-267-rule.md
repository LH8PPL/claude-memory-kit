---
id: P-C9T2E2aS
type: project
shape: State
title: v0.6.2 Minor Release Gate Process (D-248/D-267 Rule)
created_at: 2026-07-22T08:05:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7754cc6b8d208bfa7960ab0ad15b3f0fef21336439c92a4b7b1d3bb33ff67b5c
related: [v0-6-2-release-is-gated-on-your-approval-3qukr7hj, d-24-constraint-patch-releases-skip-d-248-backlog-sweep, minor-release-triggers-backlog-sweep]
---

For minor releases (unlike patches), the sequence is: backlog trigger-walk sweep → release mechanic → tag push. v0.6.2 carries a breaking change (Node-20-drop), making this a deliberate release. The tag push step is manual/user-gated (not automated). Tasks merged for v0.6.2: 237, 240, 241, 243, 245.

**Why:** Minor releases with breaking changes require backlog sweep and explicit user approval at tag time

**How to apply:** Apply this gate process to the next minor release; do not automate tag push for breaking releases
