---
id: P-MWVAEXPR
type: project
shape: State
title: '"Tarball Artifact Must Carry Both D-263 and D-264"'
created_at: 2026-07-03T12:35:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 71d9db29eaf51305394bb6b8e5aeb6bb9821fccb73cb6bdbfbaf5691c0125e2e
related: [tarball-installation-requires-re-packing-after-main-merges, two-pass-fix-discipline, hand-written-research-note-frontmatter-requirements]
---

When re-packing the tarball after landing D-264, the artifact must include both the D-263 and D-264 fixes. This is the third re-pack/reinstall cycle.

**Why:** Ensures downstream installations have both fixes and maintain proper version lineage.

**How to apply:** When re-packing after landing a fix, verify that both prior and current fix IDs are included in the artifact before reinstalling.
