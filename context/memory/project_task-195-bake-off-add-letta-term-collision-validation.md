---
id: P-XD9BCGVB
type: project
title: 'Task 195 bake-off: add Letta term-collision validation'
created_at: 2026-07-02T08:09:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5f46787e4c0dc2641051e57caff74721bc32495953bf7ed905e9d02780234bff
related: [new-v0-6-2-guard-candidate-undefended-cwd-as-root-assumption, use-c-temp-or-c-tmp-for-test-scratch-never-the-repo-or-home, design-reference-awrshift-claude-memory-kit]
---

When Task 195 validates the core-memory-kit rename (post-Cursor+Codex), must check:
- Letta/MemGPT uses "core memory" as a technical term for its always-in-context memory block
- This is potential term collision in the exact domain we operate
- Semantic alignment is possible (the kit IS an agent's core memory), but requires conscious review
- Decision checkpoint: is collision survivable? semantically confusing? safe to proceed or pivot?

**Why:** core-memory-kit is the leading name, but validation defers until Cursor+Codex ship. Letta's existing "core memory" term is a specific checkable constraint within that bake-off.

**How to apply:** In Task 195 bake-off, research Letta "core memory" semantics and decide before lock-in: does overlap matter; is it aligned or confusing; safe to proceed or alternative needed?
