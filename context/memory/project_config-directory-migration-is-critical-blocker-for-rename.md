---
id: P-ZRB94KK6
type: project
shape: State
title: Config directory migration is critical blocker for rename
created_at: 2026-07-14T12:47:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e5c01d4a3abd7449bdd5623fd99f8c3a4ec61ea76486da5de1b862e05f031d29
related: [post-rename-guide-adjustment-0-backup-now-optional, text-substitution-carve-outs-for-rename, cut-gate-guides-updated-for-v0-5-4-rename]
---

The constant `~/.claude-memory-kit/` (tier-paths.mjs:112) points to users' real on-disk memory directories. Renaming this to `~/.core-memory-kit/` without a migration path orphans all existing users' cross-project personas. Migration must read the old directory if the new one is absent, or perform a one-time move on upgrade. This is the single highest-risk line in the entire change.

**Why:** Real users exist with committed memory. A blind text swap silently breaks their setup.

**How to apply:** Before executing tier 3, design and test the config directory migration. This gates the whole v0.5.4 rename.
