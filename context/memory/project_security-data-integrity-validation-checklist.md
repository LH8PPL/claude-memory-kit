---
id: P-FQNHPTPY
type: project
title: Security & Data Integrity Validation Checklist
created_at: 2026-07-01T07:32:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6788ded68b15aa74657f7a7f6fc9c42a002021f0e87b28264732c1b949b60f2a
related: [tool-quirks-discovered-in-v0-4-3-testing, config-directory-migration-is-critical-blocker-for-rename, release-merge-gate-workflow]
---

Five non-negotiable security tests in release validation:
  1. **Poison_Guard:** Real API keys are rejected with exit code 2
  2. **Home-path sanitization:** OS paths like `~` are scrubbed from stored facts
  3. **Username leak prevention:** Tested under heavy real exposure; zero leaks detected
  4. **FTS5 special chars:** SQLite query-language special characters do not crash full-text search
  5. **Unicode safety:** Invisible/zero-width Unicode sequences are detected and blocked

**Why:** The memory system must safely handle real credentials, workspace paths, and user data without accidental leaks or crashes in production.

**How to apply:** Before tagging a release, verify all five checks pass. Poison_Guard failure is a release blocker. If any check regresses, investigate before proceeding to tag.
