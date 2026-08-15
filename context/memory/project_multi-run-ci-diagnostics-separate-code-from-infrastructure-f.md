---
id: P-ECJD5TDF
type: project
shape: Timeless
title: Multi-Run CI Diagnostics Separate Code from Infrastructure Failures
created_at: 2026-07-21T15:57:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d0219ea64b130c63b7bb5a7eb5e1f8ea8280f2a13ac5df7c4aab2eef4a59b4aa
related: [d-386-documents-known-sonarcloud-server-side-failure, onnxruntime-node-postinstall-cdn-timeout, validation-gate-chain-and-stages]
---

When a CI gate fails, do not assume transience from one run. Re-running reveals root cause: different errors or endpoints indicate infrastructure issue (server-side flake, wedged state); identical errors across runs suggest code issue. Attempt 1 produced 504 at analysis creation; attempts 2–3 produced 500 at project endpoint — variation across runs is the diagnostic signal.

**Why:** Calling a failure "transient flake" after one attempt hides infrastructure problems. Comparing multiple runs transforms an assumption into a characterized failure.

**How to apply:** For CI failures, run 2+ times and compare error codes, endpoints, timing. Different errors = investigate server-side (check D-386, status pages, account state). Same error = likely code issue requiring fix.
