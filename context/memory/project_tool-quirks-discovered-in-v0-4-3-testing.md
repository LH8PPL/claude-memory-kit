---
id: P-NDEA4RL4
type: project
title: Tool Quirks Discovered in v0.4.3 Testing
created_at: 2026-06-30T20:23:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 92e8d0db92b3b6c5cbddb2fb2d96a29ddfec0751507e2cbb6a5b592f43f39971
related: [cut-gate-v0-4-3-verification-checks, security-data-integrity-validation-checklist, mcp-activation-restart-behavior]
---

- **Rich flag vs bare remember** (PR1): Using bare `remember` does not trigger the recurrence-promotion path; requires the rich flag to be set.
- **init-user-tier prerequisite** (PR4): The no-`--to` promotion flow expects `init-user-tier` to run first; fails without it.
- **Zero-width Unicode in cmk remember** (PR5): Passing zero-width Unicode to `cmk remember` causes exit code 2 with no output written (not a crash, intended safety behavior).

**Why:** These are non-obvious behaviors discovered under live testing; future workflows or gate checks need to account for them.

**How to apply:** Document these in test fixtures and gate probes. When adding remember-like features, check for the rich-flag requirement.
