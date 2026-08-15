---
id: P-N5YLL25P
type: project
shape: State
title: 'HC-6: Native Auto Memory Runs Alongside Kit'
created_at: 2026-07-20T18:17:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cc3d8c4d237ed1ba25197ee959ec04d942fa12e5d6c38dc3872e4091ce9c74e2
related: [core-memory-kit-v0-6-4-installed-dual-memory-layers-active, cmk-install-activation-and-native-memory-options, core-memory-kit-installed-with-claude-code-hooks]
---

Anthropic's native Auto Memory and core-memory-kit both inject at session start. Doctor warns about HC-6; remedy available: `cmk disable-native-memory`

**Why:** Double layer can cause redundancy or confusion; knowing the condition and remedy helps avoid debug cycles

**How to apply:** Check `cmk doctor` for HC-6 warnings; if undesired, run `cmk disable-native-memory`
