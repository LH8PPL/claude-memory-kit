---
id: P-WKSP73MT
type: project
shape: Timeless
title: prebuild-install Deprecation Causing npm ci Failures
created_at: 2026-07-20T20:58:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e4bfedf0b870b6a57d7edb2eee54b256c2226d3eb35135ed3fa9d8a3c46eac00
related: [npm-registry-instability-and-v0-6-4-workflow-hardening, onnxruntime-node-postinstall-cdn-timeout, npm-test-fragility-under-load]
---

npm ci fails due to deprecated `prebuild-install` native path. Task 141b covers migration off it. First symptom observed in v0.6.1 release; expect recurrence in future releases until migration is complete. Do not dismiss these as transient flakes.

**Why:** Known deprecation moving toward removal. Symptom will repeat predictably until the root cause (task 141b) is addressed.

**How to apply:** When you see prebuild-install-related CI failures, reference task 141b as the root cause, not a flaky test. Prioritize the migration in the next release cycle.
