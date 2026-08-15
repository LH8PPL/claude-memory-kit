---
id: P-QKFZaQJE
type: project
shape: Timeless
title: VBS Launcher Quirk for Hidden Scheduled Task Windows
created_at: 2026-07-19T06:14:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9d070d49b7f30456d65aa16dc83261a6665604b3e47b944925abb382fda46155
related: [youtube-to-slide-scheduled-task-shims-vbs-launchers, close-claude-code-before-global-cmk-install-to-avoid-ebusy, windows-rmsync-cleanup-flake-workaround]
---

Windows scheduled task popups can be hidden by wrapping the executable in a .vbs launcher script rather than running cmd directly.
Pattern: Create a .vbs file in a gitignored directory (e.g., context/.locks/), point schtasks to the .vbs instead of the original cmd, and use VBScript to invoke the original command with hidden window flag.

**Why:** Visible cmd popups on schedule are disruptive; VBS wrapper is transparent to task logic but hides the UI.

**How to apply:** If a scheduled task shows a popup: (1) create a .vbs wrapper in context/.locks/, (2) use schtasks /change to repoint the task, (3) test via manual schtasks /run to verify both functionality and exit code.
