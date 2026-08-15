---
id: P-TFZDPX6J
type: project
shape: State
title: 'D-388 Project Discipline: Document Unreachable Code'
created_at: 2026-07-27T09:20:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a07f4fc6ffd5800576f3731a56557d844063ce3b2aac71186fdd16defc120278
related: [sonarcloud-coverage-gate-threshold, name-guard-flags-templated-patterns-in-frontmatter-metadata, decision-log-system-for-known-limitations]
---

When code contains branches unreachable by construction (e.g., defensive guard arms), document them in place rather than fabricate test coverage for them.

**Why:** Applied during Task 257 coverage gate work; existing project discipline referenced as the decision principle.

**How to apply:** For unreachable branches in future development, follow D-388: document the unreachability rather than write artificial tests.
