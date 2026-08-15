---
id: P-5GaLaDPK
type: project
shape: State
title: cmk view (Task 255) architecture and constraints
created_at: 2026-08-02T19:23:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b6edaafc766bedf8f9017636c6b5542087eda5efc0c7497f3de8dd2c0da5b5a9
related: [kit-design-principle-zero-git-writing-code, modular-skill-architecture-read-write-separation, architecture-decisions-recorded-in-adrs]
---

The viewer implementation consists of:
- Five views
- Ephemeral loopback server (temporary, not persistent)
- Read-only by construction (no write operations)
- Zero new dependencies (no external packages added)

**Why:** The viewer's read-only, dependency-free design is a key architectural constraint that shapes future development and integration decisions.

**How to apply:** When extending the viewer, adding features, or considering new dependencies, verify compatibility with read-only and zero-dependency boundaries. These are intentional design limits.
