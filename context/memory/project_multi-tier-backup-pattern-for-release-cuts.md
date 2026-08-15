---
id: P-B559EHDZ
type: project
shape: Preference
title: Multi-Tier Backup Pattern for Release Cuts
created_at: 2026-07-15T07:03:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 04e3c4088e2ff5f0ff6dd58cd905d1c37fa38288c7bf331326b95c88b1d98b79
related: [pre-release-testing-setup, persona-directory-moved-to-core-memory-kit, user-tier-memory-backup-before-testing]
---

When cutting a release with path/tier migrations, maintain three independent backups:
  - Pre-rename snapshot (dated, e.g., `23_v0.5.4_rename_cut-gate/`)
  - Pre-gate-moved copy (e.g., `~/.core-memory-kit.pre-gate-moved`)
  - Earlier historical backup

**Why:** Structural changes (path renames, tier migrations) risk persona corruption. Three tiers enable full recovery if gate validation fails.

**How to apply:** Before starting a release cut, back up the user tier (old or new path) into three locations with clear version labels; archive, don't overwrite.
