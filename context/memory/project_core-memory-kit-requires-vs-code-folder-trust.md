---
id: P-ZRKLT9K2
type: project
shape: State
title: Core Memory Kit Requires VS Code Folder Trust
created_at: 2026-07-19T06:43:55Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0cfcf34db2d8b2d921e61582112a06bb5ce16b9fbe0fd01a5b36be14851a8288
related: [workspace-trust-requirement-for-claude-skills, cmk-workspace-rename-invalidates-per-workspace-permissions-h, kiro-cli-env-passing-limitation]
---

The core-memory-kit requires explicit folder trust in VS Code to function. Without it, VS Code ignores installed permissions and blocks the kit's background write operations.

To grant trust: Open the project folder in VS Code. When prompted "Do you trust this workspace?", click **Yes**. (Alternatively, a CLI one-liner is available in SETUP docs or previous installation instructions.)

**Why:** Kit's background memory jobs require write access. This was discovered during migration when permission popups appeared until trust was granted.

**How to apply:** After kit installation/migration, if write permission errors appear later, ensure the folder is trusted in VS Code.
