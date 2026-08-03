---
id: P-B6XE3CYL
type: project
shape: State
title: Git Hooks Resolve to Global CMK via PATH
created_at: 2026-08-03T12:50:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 81a5e496e7f2fd58c55d65ccf690490ad50a7ff0fb3aa0f2aa514af7457c6596
---

Hooks call bare binary names (`cmk-capture-turn`, `cmk-inject-context`, etc.) that resolve through PATH to the global @lh8ppl/core-memory-kit install, not the local dev tree. This causes version lag: the project has been running v0.6.1 while development reached v0.6.4, missing fixes and features from recent releases.

**Workaround:** Some commands (e.g., `cmk view`) only work via dev tree (`node packages/cli/bin/cmk.mjs view`) until global version is upgraded.

**Why:** Bare names decouple from local structure but risk version lag when development outpaces the global install.

**How to apply:** Keep global version in sync. Upgrade: `npm install -g @lh8ppl/core-memory-kit@latest && cmk install`. The install command refreshes scaffolds and runs auto-recovery.
