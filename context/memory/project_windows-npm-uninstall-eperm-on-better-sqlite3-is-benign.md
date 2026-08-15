---
id: P-aH493FLQ
type: project
shape: Timeless
title: Windows npm uninstall EPERM on better_sqlite3 is Benign
created_at: 2026-07-02T18:57:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6e8fab85d59b500a2075f653b99388ed3d2ad14a87a1ea70da404c6eefe52012
related: [better-sqlite3-eperm-cleanup-warning, windows-npm-uninstall-better-sqlite3-node-lock, windows-npm-eperm-warning-on-better-sqlite3-node-is-benign]
---

When uninstalling npm packages with native modules (especially better-sqlite3) globally on Windows, npm warns about EPERM on the compiled .node file. This is a benign OS file-lock and does not prevent successful uninstallation or reinstallation.

**Why:** Prevents false alarms during release cuts when this warning appears.

**How to apply:** Ignore EPERM on .node files during npm uninstall -g on Windows; the package removal succeeds and reinstall will work.
