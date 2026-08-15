---
id: P-TDSSGWFK
type: project
shape: State
title: Pre-commit Hook Sanitizes Fact Files for Security
created_at: 2026-07-03T10:57:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1e008781b0e246f6c0a94d51e5a48e9c64bad68a57cfe0cd6a43e3db7d15e459
related: [pre-commit-pii-validator-on-context-commits, skill-review-imported-facts-staleness-bug-fixed, validate-docs-enforces-catalog-consistency]
---

The project uses a pre-commit hook that automatically catches and sanitizes username leaks and other sensitive data in dogfood fact files before commits. Demonstrated in this session catching a real username leak.

**Why:** Prevents accidental credential or identity disclosure in the codebase

**How to apply:** When adding facts/documentation, rely on the pre-commit hook to catch identity leaks before commit
