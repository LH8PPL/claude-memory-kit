---
id: P-WG4UCG5R
type: project
shape: Timeless
title: Dual README Files Must Stay Synchronized
created_at: 2026-07-15T18:03:00Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 244a4deeb591113b60f094087d92a715f774dbf30402e2e08f9a63f89e374aa1
related: [archive-registration-in-documentation-map-md, release-cut-verification-checklist-claude-memory-kit, always-use-venv-for-python-package-installs]
---

- Root `README.md` and `packages/cli/README.md` must contain identical content
- Changes to one should always be applied to the other
- Both are actively viewed and kept in lockstep

**Why:** Users access the project via different entry points (root repo vs npm package); content consistency is critical

**How to apply:** When editing README, apply the same change to both files; verify sync after any README edit
