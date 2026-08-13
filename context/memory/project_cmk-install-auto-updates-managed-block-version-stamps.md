---
id: P-AMCCLEUS
aliases: [P-AMCCLEUS]
type: project
shape: Timeless
title: cmk install Auto-Updates Managed Block Version Stamps
created_at: 2026-08-03T14:04:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5895660ce91be98d9fe82c5d418b594a3ca04e98157cc0e030fc8006968204e2
related: [hc-9-drift-after-claude-code-update-v0-3-4, cmk-version-bumping-convention, bash-cwd-drift-creates-packages-cli-context-artifacts]
---

When running `cmk install` to upgrade the global binary, the tool automatically updates managed blocks' version stamps (e.g., v0.6.2 → v0.6.4). This is intentional behavior (Task 230's refresh mechanism), not a stray edit.

**Why:** Prevents confusion about automatic version changes during upgrades; clarifies that the tool itself modifies these files as part of the upgrade flow.

**How to apply:** When seeing version-stamp changes after `cmk install`, recognize them as expected tool behavior and check them in or stash as appropriate.
