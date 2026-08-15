---
id: P-YD6SLA3Q
type: project
shape: Timeless
title: Windows npm `EPERM` Warning on better_sqlite3.node Is Benign
created_at: 2026-07-06T12:13:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 84dd80ce7a08940b4a0501188421d9d010b57cf04375fbf5752a8bc318fc804a
related: [better-sqlite3-eperm-cleanup-warning, windows-npm-ebusy-on-better-sqlite3-lock-expected-and-harmle, cmk-hook-capture-fails-during-stress-gate]
---

During npm install on Windows, a file-lock error (`EPERM`) may appear for `better_sqlite3.node` during cleanup. This is not a failure — the install completes successfully (logs "added X packages, changed Y"), and `cmk --version` confirms the installed version. It is Windows-npm cleanup noise, not a blocking error.

**Why:** Prevents user panic or false failure detection in future test runs; the warning can be safely ignored.

**How to apply:** If you see this warning during npm install, verify the success message and run `cmk --version` to confirm the correct version installed — do not treat it as a failure.
