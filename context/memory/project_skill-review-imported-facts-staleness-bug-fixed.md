---
id: P-E6J7aYH5
type: project
title: skill-review Imported-Facts Staleness Bug Fixed
created_at: 2026-06-12T20:52:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d2b60b42a698d28ceb1ebebab23ca39180b2e652
related: [pre-commit-hook-sanitizes-fact-files-for-security, resume-fact-convention-capturing-uncommitted-code-intent, memory-kit-validates-itself-as-dogfood-test-subject]
---

A bug in skill-review regarding imported facts' staleness properties was identified during live testing on the dogfood memory system, fixed, and pinned to the codebase.

**Why:** Correctness of the memory system depends on imported facts remaining fresh. This bug threatened that invariant.

**How to apply:** When working on skill-review or fact-import logic, ensure this fix remains pinned and its test coverage is maintained.
