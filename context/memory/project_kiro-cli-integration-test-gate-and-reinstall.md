---
id: P-WL22GQ9J
type: project
title: kiro-cli Integration Test Gate and Reinstall
created_at: 2026-06-24T14:24:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: dfa6dc89437a9d6c592107d1930a76cf5123b0cf242993027757b5c2f34318b2
related: [memory-persistence-validation-workflow-end-to-end, kiro-cli-memory-integration-test-procedure, cmk-install-kiro-setup-commands]
---

Live integration environment for validating memory persistence:
- **Gate location**: `C:\Temp\kiro-cli-gate`
- **Reinstall command** (run from within gate): `cmk install --ide kiro`
- **Test pattern**: Launch `kiro-cli chat`, state a preference, verify it lands in `context/`
- **Validation**: Facts should appear in `C:\Temp\kiro-cli-gate\context\` after the interactive session

**Why:** Interactive session testing is the authoritative proof of memory persistence. Code inspection alone is insufficient.

**How to apply:** Use kiro-cli as the integration harness for all memory-related fixes. After rebuild+reinstall, run a live chat session and check that the stated preference persists to the context/ folder.
