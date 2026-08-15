---
id: P-BWAGUDTB
type: project
shape: State
title: .obsidian Folder Gitignore at Any Depth
created_at: 2026-07-23T10:27:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2794924aea2f5e58469c9292d31a54e4638879a22756080771e9a914be6f60ad
related: [name-guard-flags-templated-patterns-in-frontmatter-metadata, autopilot-merge-rules-for-install-surface-changes, backlog-tracked-with-lanes-and-triggers]
---

Gitignore pattern must exclude `.obsidian/` at any depth (e.g., `**/.obsidian/`) because Obsidian auto-creates this folder when opening any vault, creating merge/commit noise if left unignored.

**Why:** Obsidian creates .obsidian/ metadata folder automatically; without depth-inclusive pattern, different vault opens pollute the repo with uncommitted changes

**How to apply:** Ensure .gitignore uses pattern that catches .obsidian/ at any level; already fixed (D-399)
