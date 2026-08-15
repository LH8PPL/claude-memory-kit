---
id: P-W9ZULZMJ
type: project
title: Pre-Release Testing Setup
created_at: 2026-07-01T06:16:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5c5d09757ae08ca0152a267671265d4e937f56b7889e96dcdde59429c8a4838d
related: [user-tier-memory-backup-before-testing, multi-tier-backup-pattern-for-release-cuts, version-0-5-4-tarball-ready-for-gate-testing]
---

Before testing a new global package release, back up the current user-tier memory installation to a timestamped directory (e.g., `C:\cut-gate-backups\user-tier_YYYY-MM-DD_HH-mm-ss`), uninstall the old global package from npm, and install the new .tgz version from the local package directory.

**Why:** Protects user data during pre-release testing and enables rollback if issues arise.

**How to apply:** Before starting cut-gate testing, run the backup+uninstall+reinstall sequence; keep the backup until testing is complete and verified.
