---
id: P-G9KA7B72
type: project
title: Kit Install Pre-Configuration Expectation
created_at: 2026-06-26T16:00:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1fdcf9b00125a62bd9c55250d97b0117c1814dc551a0cf38e9e24de0bc353018
related: [windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, skill-composition-pattern-scaffold-allow-list-must-be-update, gate-check-g0-cli-version-verification]
---

After `cmk install` completes, the memory-write skill should be added to Claude Code's allow-list automatically. Users should never see a permission prompt for pre-authorized kit skills. A prompt appearing indicates either: (a) the allow-list wasn't properly written during install, or (b) an external factor (Claude Code version/bug) broke the configuration.

**Why:** The kit's design contract is zero-friction setup — once installed, tools work without friction. Prompts after install violate this and signal a broken install or incompatibility.

**How to apply:** On diagnosis, verify allow-list was written to the correct location during `cmk install`. If allow-list is correct but prompts still appear, check Claude Code version against issue #14956 (Skill() + allowed-tools composition bug).
