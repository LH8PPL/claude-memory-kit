---
id: P-WFKR4FaT
type: project
shape: Timeless
title: Agent CLI Validation Requires Exit Code Check, Not Just PATH Presence
created_at: 2026-07-05T14:31:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e015f95638715ffcb10c8e04c1e2cd8913dd9655b2368077c149ec68fda41e8d
related: [cursor-native-windows-powershell-support-confirmed, cut-gate-validation-includes-paraphrase-recall-check]
---

Cursor installer bug (through May 2026) could deposit Unix CLI binary under Git Bash without functional Windows support, passing PATH discovery but failing at invocation. Single source of truth: `agent --version` (or equivalent version probe) exit code. PATH-based discovery (where/which) is necessary but not sufficient.

**Why:** Silent failures (CLI present but non-functional) are worse than detection failures; exit-code validation catches misconfiguration that PATH checks miss

**How to apply:** Kit agent-detection routines should call `agent --version` and verify exit code == 0, not just check `where agent` result exists
