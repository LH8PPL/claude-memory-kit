---
id: P-P4CZUCSN
type: project
shape: State
title: Node Version Floor Bumped to 22 in v0.6.2
created_at: 2026-07-21T18:17:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6d2f3f07507d9795f8dd9cecb0ef850e4c9eb8b5ab12b5b57b5a814065c5418f
related: [v0-6-2-breaking-node-20-support-dropped, onnxruntime-node-postinstall-cdn-timeout, node-sqlite-migration-decision]
---

- `engines.node`: >=22 (documented as BREAKING change in CHANGELOG)
- `.nvmrc`: 22
- CI configured to run Node 22
- Breaking change motivated by better-sqlite3 v13 upgrade; eliminates deprecation warnings (prebuild-install v7)

**Why:** better-sqlite3 v13 has a hard Node 22 floor. This is a breaking change for users on Node <22.

**How to apply:** Future sessions must remember this floor. If backporting or supporting older Node, this is the constraint. Use for decisions about what versions to test against.
