---
id: P-62Y6FYUW
type: project
shape: State
title: youtube-to-slide Claude Code Trust Requirement
created_at: 2026-07-19T06:14:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 74ead4af0443eab5b1ab2103c7a16e10d1187ad70d1e2bff5f24c30a73e4d9dd
related: [core-memory-kit-requires-vs-code-folder-trust, youtube-to-slide-migration-to-core-memory-kit-complete, youtube-to-slide-foreign-format-fact-file-pre-existing-not-r]
---

Writing to memory curation tasks requires the Claude Code trust flag to be set for `C:\Projects\youtube-to-slide`.

Current status: NOT SET (blocking curation writes)

Unblock by one of:
- Open Claude Code in `C:\Projects\youtube-to-slide` and accept the trust dialog (automatic)
- Manually edit `~/.claude.json` and set `projects["C:/Projects/youtube-to-slide"].hasTrustDialogAccepted: true`

**Why:** The permission system enforces trust boundaries for sensitive operations like memory writes; the assistant cannot modify ~/.claude.json without explicit user action.

**How to apply:** Next session: if curation fails, check trust status immediately. Verify `projects["C:/Projects/youtube-to-slide"].hasTrustDialogAccepted` in ~/.claude.json.
