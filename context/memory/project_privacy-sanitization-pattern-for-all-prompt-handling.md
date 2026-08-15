---
id: P-DCW27YSQ
type: project
shape: State
title: Privacy Sanitization Pattern for All Prompt Handling
created_at: 2026-07-22T20:10:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4269cd7a5fc58b77518dace50d70480e6b52538b8b8e83d700e194ef98b65cd6
related: [canonical-registry-for-persona-search, closed-products-recall-architecture-validation]
---

All prompts must be sanitized using `sanitizePrivacyTags` + `maskPii` BEFORE any use (search queries, logging, indexing). Private-tagged content must never reach disk or indices; the sanitized prompt becomes the source of truth for all downstream operations. Regression test captures the privacy breach reproduction (raw prompt with PII landing in `recall.log`).

**Why:** Task 233 implementation logged raw prompts to disk, leaking `<private>` content (including PII/SSN). Violates the kit's privacy contract.

**How to apply:** When handling user prompts, sanitize as first step. Reference Task 233 fix as canonical implementation pattern.
