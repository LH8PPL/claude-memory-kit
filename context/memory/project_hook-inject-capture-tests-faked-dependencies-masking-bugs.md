---
id: P-DT9KQG9V
type: project
shape: State
title: Hook/Inject/Capture Tests Faked Dependencies, Masking Bugs
created_at: 2026-07-04T06:10:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9ad7f4a72a5d7ba75bbf162e2ec913711e3965ec960aa8c7c947e39601494d05
related: [test-seam-blindness-injected-fakes-mask-real-world-defaults, wired-but-dead-observe-legs-recurring-bug-pattern, stress-testing-omitted-for-pure-read-cli-changes]
---

Unit tests for routing/inject/capture have relied on faked dependencies (non-existent fields, dropped edit content). This masked D-269 (Kiro empty snapshot since v0.4.0) and afterFileEdit (wired-but-dead code) until live-test and skill-review caught them during PR #254.

**Why:** Mocks create false test confidence. Real bugs only surface when the full integration stack runs.

**How to apply:** When testing hook/inject/capture plumbing, always use real injector and real file-edit flow. Lock findings with integration tests.
