---
id: P-DMPCD5F3
type: project
title: bash-cwd-drift creates packages/cli/context/ artifacts
created_at: 2026-06-13T09:46:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0276f55531c705f29f9fc059a481b9debdcb7292
related: [cmk-install-auto-updates-managed-block-version-stamps, windows-npm-uninstall-eperm-on-better-sqlite3-is-benign, kiro-cli-env-passing-limitation]
---

When bash CWD drifts during operations, stray artifacts appear at `packages/cli/context/`.
These are gitignored and harmless — the cause is understood and documented to prevent future confusion.

**Why:** Prevents misidentification of artifacts as uncommitted work; documents a known benign quirk

**How to apply:** When seeing this path, check .gitignore — it is expected and harmless
