---
id: P-SZE7EEYa
type: project
title: Vitest Pool Corruption — Transient Load Failures
created_at: 2026-06-30T07:18:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7fef0e9b187e7f586bf5317a25eee40378bb0a350a2987decd3aae3423025a55
related: [stress-gate-process-for-pr-merge, onnxruntime-node-ci-download-flakiness, cmk-hook-capture-fails-during-stress-gate]
---

Vitest can experience transient pool corruption that causes all test suites to fail to load (displaying 0 actual test failures). Fresh `npm test` re-runs clear the corruption automatically (verified 5/5 re-runs in this session).

**Why:** Distinguishes transient vitest infrastructure issues from real code failures; prevents false-alarm debugging when all loads fail but no actual tests fail.

**How to apply:** If many test suites fail to load with 0 actual failures, re-run before investigating code. Do not treat load failures as a code problem without a second run.
