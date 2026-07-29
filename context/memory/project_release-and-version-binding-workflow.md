---
id: P-MD92EVYJ
type: project
shape: State
title: Release and Version-Binding Workflow
created_at: 2026-07-29T07:50:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e64506212a84d8481587528477014f58c8bb28c0b39d8523e4eca854aa1c2529
---

- **Pre-tag requirement**: Wait for CI to be fully green before creating a release tag
- **Publishing**: `git tag <version> && git push origin <version>` automatically publishes to npm and creates a GitHub Release
- **Version-independent work**: Grill conversations (e.g., #250, #255) and dependabot CI-workflow bumps can be scheduled/completed independently of version releases
- **Version-dependent work**: Code builds and features belong in the next version

**Why:** Ensures stable, automated releases with CI gates; clarifies which project work is tied to versioning vs. can happen on its own timeline

**How to apply:** When releasing, confirm all CI passes before tagging. For planning, separate version-dependent (builds/features) from version-independent (meetings, CI infrastructure) work.
