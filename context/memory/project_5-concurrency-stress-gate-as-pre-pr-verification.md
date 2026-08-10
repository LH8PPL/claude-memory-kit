---
id: P-7T5EJATL
type: project
title: 5× Concurrency Stress Gate as Pre-PR Verification
created_at: 2026-06-21T11:37:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 60b63f4d46d63cc237314230d086193d068a76c03f06e8f50559f0842878e98e
related: [stress-gate-release-workflow, stress-test-phase-in-pre-merge-workflow, full-gate-re-run-on-final-code-after-code-review]
---

The project uses a 5× concurrency stress gate (re-running the full test suite 5 times concurrently) to surface concurrency-class bugs before PR. Exit code 0 means all 5 runs passed; this gate confirms safety for PR review.

**Why:** Concurrency bugs are hard to trigger in single runs; stress gates reliably expose them.

**How to apply:** After fixing flakes, re-run the stress gate. Only open PR once gate is clean (5/5 passed).
