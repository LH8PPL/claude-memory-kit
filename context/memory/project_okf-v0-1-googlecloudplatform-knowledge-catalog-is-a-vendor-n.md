---
id: P-EYCWXa3K
type: project
shape: State
title: 'OKF v0.1 (GoogleCloudPlatform/knowledge-catalog) is a vendor-neutral spec: markd'
created_at: 2026-07-22T16:39:09Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 07ab2d428428c80885e8542dc33280e4cebd911817758ed5e8fc876127d21c82
related: [open-knowledge-format-okf-design-validation-and-interchange]
---

OKF v0.1 (GoogleCloudPlatform/knowledge-catalog) is a vendor-neutral spec: markdown files + YAML frontmatter (required 'type' field) + index.md + log.md + git-native + agent-maintainable. core-memory-kit's context/ tier is ~90% OKF-aligned, and the maintainer's personal wiki already matches OKF structure (wiki/index.md, wiki/log.md). The kit is ahead of OKF on the hard parts: trust levels, tiering, caps, capture coercion, poison screening, hybrid recall. Google independently converged on the same markdown-in-git agent-maintained shape — validating the pattern. See docs/research/2026-07-22-okf-google-open-knowledge-format.md, Task 251, D-391.

**Why:** Positions the kit within an emerging vendor-neutral ecosystem; strengthens the adoption narrative and external credibility

**How to apply:** OKF research note + SOURCES entry recorded; Task 251 (cmk export --okf interop) filed deferred with a named trigger
