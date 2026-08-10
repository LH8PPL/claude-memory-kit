---
id: P-P9HT6G2U
type: project
title: 30s Hook Ceiling Constraint & Real Haiku Roll Timing
created_at: 2026-06-26T09:48:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cb6059cf59b121346757d6c9bcea598c015a20b4d920afea0640f725ea19ee00
related: [sessionstart-hook-ceiling-constrains-synchronous-operations, hook-ceiling-enforces-operation-time-caps, kiro-cli-env-passing-limitation]
---

The npm hook ceiling is **30 seconds**. Real `claude --print` (Haiku) command execution takes **18–37 seconds**, exceeding this hard constraint.

The original Q4 design (synchronous drain at SessionStart) violated this ceiling. Live test revealed it; design analysis alone would have missed it.

**Why:** Hard environmental constraints (hook timeouts, resource limits) emerge only during real execution, not during design phases.

**How to apply:** When designing hook-based or time-sensitive operations, live-test with real execution before finalizing. The 30s ceiling is a hard constraint.
