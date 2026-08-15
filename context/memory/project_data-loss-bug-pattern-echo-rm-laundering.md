---
id: P-RE6969aV
type: project
title: 'Data-Loss Bug Pattern: echo && rm Laundering'
created_at: 2026-06-22T17:14:11Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 98ea7c83b87186c13b0888813a41d194b8cb81dccfb67d08da01e2d9e8bdb029
related: [guardrail-review-process-two-pass-primary-source-verificatio, regression-test-pinning-on-bug-fixes, skill-review-imported-facts-staleness-bug-fixed]
---

During the guardrail review (PR #218), a serious data-loss bypass was identified and fixed: shell command laundering via `echo && rm` sequence. This was one of two data-loss bypasses caught by the two-pass review process.

**Why:** This specific vulnerability pattern represents a real risk the project has encountered. Future reviews should watch for it.

**How to apply:** When reviewing guardrail or safety-critical code, flag command sequences that launder operations (echo, printf, etc.) as potential bypass mechanisms. Ensure test coverage for this pattern.
