---
id: P-T5PRWZEP
type: project
shape: Timeless
title: CRLF Line-Ending Quirk in removeKitOnlyInstructionResidue
created_at: 2026-07-04T05:56:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0e27443f24a1967f61c712ec8d4da453f1c425b9327cc6aedc1d2e9479cd302d
related: [kiro-uninstall-husk-cleanup-followup, npm-uninstall-eperm-error-with-sqlite-vec-dll-on-windows, windows-npm-uninstall-eperm-with-better-sqlite3]
---

- **Issue**: Function compares `left === kitFrontmatter` where `left` is read file content and may have Windows CRLF (`\r\n`), but `kitFrontmatter` template is normalized to Unix LF (`\n`).
- **Result**: Files with CRLF line endings fail the equality check and survive (not removed).
- **Safety**: Fails in safe direction — keeps user-modified files. No data loss, only possible kit-frontmatter residue on Windows.

**Why:** String equality on line-ending-sensitive content; affects Windows users specifically.

**How to apply:** On Windows, expect possible leftover kit frontmatter after uninstall. If strict cleanup is required, normalize line endings before the comparison.
