---
id: P-36CEKTXX
type: project
title: better_sqlite3 EPERM Cleanup Warning
created_at: 2026-06-23T20:36:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f6aea645896f6a136bf63960f3936cee4b40ab233a8356a7c078d18da7c69e8e
related: [windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, windows-npm-ebusy-on-better-sqlite3-lock-expected-and-harmle, windows-npm-uninstall-eperm-on-better-sqlite3-is-benign]
---

During `npm install -g` of claude-memory-kit, npm cleanup fails on better_sqlite3.node with EPERM (operation not permitted), but the package installation continues successfully. Full output: warns about inability to unlink `better_sqlite3.node`, then completes with "added 4 packages, and changed 137 packages."

**Why:** This warning is expected/ignorable—failure during cleanup doesn't mean the build or installation failed. Knowing this prevents unnecessary troubleshooting or reinstallation attempts in future testing cycles.

**How to apply:** When installing claude-memory-kit updates globally, expect this EPERM warning. Treat it as non-fatal; verify the install succeeded by running `cmk --version`.
