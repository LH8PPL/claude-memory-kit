---
id: P-RaKMKKLK
aliases: [P-RaKMKKLK]
type: project
shape: State
title: v0.6.6 Release Ready for Tag
created_at: 2026-08-13T14:12:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 402040a935f02f7a87faddb75f2a2adb3ef4ad9d5cdf6b16f1c4a2f2b364b7a5
---

- **Status**: Cut and ready for release at commit c4804459
- **Tag procedure**: `git tag v0.6.6 && git push origin HEAD --tags`
- **CI automation**: Triggers `publish.yml` which:
  - Runs full test suite on CI
  - Publishes to npm with provenance
  - Auto-generates GitHub Release from CHANGELOG

**Why:** The release cut is complete; next session needs the exact tag command and to understand the automated release flow that follows it.

**How to apply:** When releasing v0.6.6, run the tag command as documented. The publish.yml automation handles the rest. Check publish.yml if CI fails or npm publish needs intervention.
