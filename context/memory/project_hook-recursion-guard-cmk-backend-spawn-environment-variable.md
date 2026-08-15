---
id: P-PXCAJEH4
type: project
shape: Timeless
title: Hook Recursion Guard — CMK_BACKEND_SPAWN Environment Variable
created_at: 2026-07-04T10:25:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a60224d795ed5cda44ae999244b295ef466de3f1f866bddb40ccf642085ff1e6
related: [kiro-cli-backend-live-probe-confirmed-working, v0-4-5-agent-relative-llm-backend-feature, v0-4-5-kiro-cli-dispatch-guard-implementation]
---

When LLM backend is spawned from inside kit's own hooks (e.g., a hook calls `kiro-cli`):
  - Dispatcher entry checks for `CMK_BACKEND_SPAWN` env var
  - If set: inner hooks become no-op (skip their LLM spawning logic)
  - Env var propagates through spawned processes
  - Effect: prevents infinite recursion (reproduced live during Task 200 research)

**Why:** Backends need to be callable from within hook execution; without guard, infinite loop occurs

**How to apply:** Set `CMK_BACKEND_SPAWN` when spawning LLM backend; check it in dispatcher entry to conditionally disable hook setup for inner invocations
