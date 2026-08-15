---
id: P-5PC4DaJF
type: project
title: Windows npm Uninstall EPERM With better_sqlite3
created_at: 2026-06-16T09:08:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7026380ffc7d052d599709c4f2a95a0b93a39245c719716fc607cd17a0980d3a
related: [windows-npm-uninstall-better-sqlite3-node-lock, windows-npm-ebusy-on-better-sqlite3-lock-expected-and-harmle, better-sqlite3-eperm-cleanup-warning]
---

On Windows, `npm uninstall` after building `better_sqlite3.node` fails with EPERM (permission denied) because the compiled DLL remains locked by the Node process. The packages are removed despite the error; the leftover temp dir is cosmetic cruft.

The kit acknowledges this as a known annoyance. (Node:sqlite would sidestep it via async DLL handling, but was rejected for perf reasons.)

**Why:** EPERM during teardown/rebuild is a frequent false alarm on Windows. Knowing it is harmless and expected prevents misdiagnosis and unnecessary re-runs.

**How to apply:** If EPERM appears during `npm uninstall` on Windows, check that "removed N packages" still printed. If yes, the uninstall succeeded; the locked DLL is expected. No action needed.
