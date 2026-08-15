---
id: P-2JMVXJ3a
type: project
title: 'Task 146: Concurrent Swarm Support Testing'
created_at: 2026-06-13T02:23:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4fd5dcdbed2df5a8f4ed4c22b5433c6c85b53aa6
related: [live-test-harness-cannot-detect-missing-cli-dependency, kit-skills-are-modular-thin-orchestrators-over-a-deep-cmk-su, use-c-temp-or-c-tmp-for-test-scratch-never-the-repo-or-home]
---

Task 146 (Claude Code Workflows) is designed to test the kit's support for concurrent subagent swarms with shared memory. The critical untested component is concurrent `mk_remember` calls under swarm load — this is the validation needed before claiming the kit can support stateful swarms.

The kit's architectural role: it is the "shared-context substrate" (the middle band) that makes concurrent pipelines stateful, NOT the orchestration/chaining framework. The kit should remain reusable and modular, not expand to manage pipeline orchestration.

**Why:** The kit's strength is as a shared memory layer for many independent agents. Concurrent safety is the missing validation needed before swarm support is proven.

**How to apply:** Task 146 test harness should validate that multiple concurrent agents can safely call `mk_remember` without race conditions or memory corruption. Concurrent writes to shared memory under swarm load is the critical path.
