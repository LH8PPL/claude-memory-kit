---
id: P-QGKURRR2
type: project
shape: State
title: Pre-commit PII validator on context/ commits
created_at: 2026-07-05T18:57:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 31ffecf2d2ba3eb7ce58d8bc023360c44d8fcefb446c9640b7ddd1601f92b7e9
related: [pre-commit-hook-sanitizes-fact-files-for-security, new-v0-6-2-guard-candidate-undefended-cwd-as-root-assumption, memory-commits-screened-before-release]
---

A pre-commit hook validates `context/` commits using a "name-confinement validator" that detects and rejects PII/secrets (emails, API keys, tokens, etc.). If PII is detected, the commit fails and must be cleaned before re-staging. This prevents accidental leaks of sensitive data to the public repository.

**Why:** The project repository is public. Accidental commits of personal/sensitive info are a real risk. The validator is the automated gate that stops these commits before they reach the repo. (Tested live this session: the validator caught an accidentally-written email and forced removal.)

**How to apply:** When committing changes to `context/`, the pre-commit screen runs automatically as a gate. If the name-confinement check fails, remove the flagged PII, re-stage, and run the screen again. Always allow the screen to run before pushing.
