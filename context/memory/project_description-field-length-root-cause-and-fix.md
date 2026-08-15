---
id: P-a2BSC7NG
type: project
title: Description Field Length — Root Cause and Fix
created_at: 2026-06-14T14:19:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6069db40b85500b6a5f1311206bd4ab0195ee5bbe34f5a6d6302315fa40e49ef
related: [skill-md-description-block-scalar-format, design-contract-enforcement-via-tests-code, line-breaking-rule-for-fact-titles]
---

The skill's description field was 1,340 characters, which broke the tool entirely. Fix: trim to 1,021 chars, rewrite in third-person, add structural guards (e.g., line breaks, indentation) to preserve YAML parsing. The fix is validated by re-test (skill now fires cleanly).

**Why:** Long descriptions were silently breaking the YAML structure or exceeding token/parsing limits. This was discovered by code inspection (challenge 1: "Did you check the docs?").

**How to apply:** When extending the kit or adding skills, keep descriptions ≤ 1,021 chars and ensure they parse correctly as YAML third-person prose.
