---
id: P-aPAXAYVX
type: project
title: 'Kiro CLI: Known Limitation — Bug #5873 Blocks Manual mk_remember'
created_at: 2026-06-24T15:59:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 00b0b20996d6a0c946e0afc30e370b7003fccebac3fdc39205b6695971b8759b
related: [kiro-cli-custom-agent-tool-limitation, kiro-cli-automatic-memory-capture-works, cross-project-rules-auto-promote-at-session-end-stop-hook]
---

- **Issue:** Kiro bug #5873 prevents the `mk_remember` tool from routing to custom assistants like claude-memory-kit's Kiro CLI integration.
- **Symptom:** Manual save commands appear to succeed in chat but don't actually persist memory.
- **Status:** Known Kiro issue (public GitHub issue); waiting on Kiro team to fix their tool-routing logic. Claude-memory-kit code is correct and will work once Kiro fixes their end.
- **Workaround:** Rely on automatic end-of-turn memory extraction (the primary feature), which works reliably.
- **Decision:** Merge the fixes with documentation of this limitation; advise users to depend on automatic capture.

**Why:** Future sessions need to know kiro-cli's primary working feature (automatic capture) and why manual saves are unavailable, so docs reflect reality and users have clear guidance.

**How to apply:** Document this limitation in kiro-cli support/release notes; emphasize automatic extraction as the stable, recommended mechanism; guide users to rely on end-of-turn memory capture rather than manual saves.
