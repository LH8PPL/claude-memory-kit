---
id: P-5Y9QQ4GK
type: project
title: Release Workflow — Cold-Open Testing Discipline
created_at: 2026-07-01T10:55:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 99e6c4ea9b56a1ddb1122b1059c0d23bcd0826a212ae4c757daf31d880c2fb77
related: [claude-memory-kit-v0-4-3-release-workflow, post-merge-clean-build-verification, claude-memory-kit-fix-verification-protocol-v0-4-3]
---

- Merge PR to main
- Watch CI green on main
- Build real tarball from main branch
- Run cold-open test: install from the tarball in a fresh environment
- Only after cold-open passes: tag + publish

**Why:** Catches bugs that pass CI in dev repo but fail in real installs (learned from a prior release incident)

**How to apply:** Before tagging any release, rebuild from main and test the actual artifact in isolation
