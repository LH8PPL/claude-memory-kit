---
id: P-D6CCPVXQ
type: project
title: npm v12 Install-Scripts Breaking Change (July 2026 Deadline)
created_at: 2026-06-25T19:51:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f15295b9a28cdebeafdcb96da2ebd0d019a5097b42aef24878a4fccd8df8a015
related: [sessionstart-hook-requires-reopen-after-install, node-sqlite-fts5-module-availability-gate-for-task-141b-migr, v0-4-roadmap-kiro-first-editor-integration]
---

npm v12 (expected ~July 2026) disables install scripts by default. The kit's semantic backend setup relies on install scripts during installation. Task 141 (npm v12 readiness) must resolve this before the deadline—without it, fresh kit installs will fail silently. This is a hard blocking constraint on production deployment timing.

**Why:** npm v12 is a shipping reality; once it releases, any user installing the kit without the fix will silently fail. This is a critical production risk with an immovable deadline.

**How to apply:** Monitor Task 141 for resolution. If still open as July 2026 approaches, escalate above other v0.4.x work. Update this fact when Task 141 ships.
