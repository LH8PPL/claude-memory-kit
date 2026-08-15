---
id: P-7U47a2QG
type: project
title: Kiro IDE 1.0.52 Agent Hooks v2 Format Verification Gate
created_at: 2026-06-25T08:56:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 11b24a152a798784e570878ce9d5ed0fe79bc26056fcf44e20d290a514416213
related: [kiro-1-0-hook-format-discovery-via-ide-generated-files, kiro-hook-activation-and-git-commit-cycle, kiro-1-0-v1-hook-schema-and-installation-naming]
---

Kiro IDE 1.0.52 displays "Agent Hooks v2" configuration screen on first open after v1 upgrade. The hook configuration format may differ from v1 code assumptions. Before modifying `.kiro/hooks/cmk.kiro.hook.json`, the official IDE documentation must be consulted to verify the exact v2 schema (version labels, field names, structure).

**Why:** The v2 label indicates format change from v1. Documentation is authoritative; format mismatches could break hook system integration.

**How to apply:** Click "Go to documentation" on the Agent Hooks v2 screen to view the official schema. Capture a screenshot or transcript. Verify the format matches what will be written to `.kiro/hooks/cmk.kiro.hook.json` before proceeding with edits.
