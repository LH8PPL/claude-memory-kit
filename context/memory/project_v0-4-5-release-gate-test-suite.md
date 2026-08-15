---
id: P-KSEF6JBY
type: project
shape: State
title: v0.4.5 Release Gate Test Suite
created_at: 2026-07-06T12:02:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 470e1b1fa8b895554634738d4a04bf43e5694c4cd327450a0b691ce6e2c9bde0
related: [multi-gate-release-verification, release-gating-workflow-for-version-cuts, release-cut-workflow-local-isolation-user-tag-push]
---

The release validation runs six gate groups on the real tarball:
- **G0**: `cmk --version` returns release version
- **G1 + BK1**: `cmk doctor` passes 11 checks, HC-11 backend available
- **BK2**: `--backend` flag validation (valid backends accepted, invalid exit 2, no half-install)
- **BK3**: `cmk config show` reports backend override correctly
- **BK4**: `cmk roll` compresses through both backends (integration proof)
- **Standing**: `remember`→`search`, `config get` correct

**Why:** Each gate validates a critical path; testing on real tarball catches issues dev repo would miss

**How to apply:** Use this suite for all release validations; fail on any gate failure; don't tag
