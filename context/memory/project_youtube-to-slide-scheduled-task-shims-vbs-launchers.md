---
id: P-FR9H7HQZ
type: project
shape: State
title: youtube-to-slide Scheduled Task Shims (VBS Launchers)
created_at: 2026-07-19T06:14:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c6f798e1e877385f32898cda43c55c00f0c8fde6b544c5a3a11124dcd898faa1
related: [vbs-launcher-quirk-for-hidden-scheduled-task-windows, youtube-to-slide-uses-core-memory-kit-scheduling, close-claude-code-before-global-cmk-install-to-avoid-ebusy]
---

Three .vbs launcher shim files created and installed in `C:\Projects\youtube-to-slide\context\.locks\` (gitignored, machine-local):
- Shims for: ytslide-weekly-memory-curator, ytslide-daily-memory-distillation, ytslide-nightly-memsearch-index
- Changed from: direct cmd window (visible popup) → VBS launcher (hidden window)
- Pattern replicated from: core-memory-kit's own scheduled task launchers
- schtasks /change commands executed to re-point all three tasks to the new shims

**Why:** The three youtube-to-slide memory tasks were triggering visible cmd popups on schedule; the VBS shim pattern hides the window while preserving task functionality and follows the established pattern used by the kit itself.

**How to apply:** If the shim pattern needs adjustment (e.g., working directory, quoting, error handling), look in context/.locks/ and compare against the core-memory-kit launcher pattern; exit-code testing via manual schtasks /run may reveal whether failures are pre-existing or shim-caused.
