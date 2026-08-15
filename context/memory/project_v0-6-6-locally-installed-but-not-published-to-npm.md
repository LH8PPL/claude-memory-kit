---
id: P-DMDS9MNH
aliases: [P-DMDS9MNH]
type: project
shape: State
title: v0.6.6 Locally Installed But Not Published to NPM
created_at: 2026-08-15T08:03:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fff72419d54c1e57d5ec3a05d4a4053782db8aa2531f55018300fa9bfde496da
related: [v0-6-6-release-ready-for-tag, release-cut-workflow-local-isolation-user-tag-push, tag-and-publish-v0-3-5-release]
---

- Locally installed: v0.6.6
- NPM public package: still serves v0.6.5
- Git state: release commit on main, tag not yet pushed
- Release action: `git tag v0.6.6 && git push origin HEAD --tags`

**Why:** Release is functionally complete and verified against real corpus but blocked on git/npm sync

**How to apply:** Check on next session if this has been run; if not, execute the tag + push command to unblock release
