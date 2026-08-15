---
id: P-FZSXVBYF
type: project
shape: State
title: D-390 Multi-Agent Architecture (Active Configuration)
created_at: 2026-07-25T09:35:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8bdff497d5c8413b9820b75897aaf2d1217f3293089105fe4b2235a3fb25201b
related: [two-pass-review-discipline-validated-on-critical-bugs, three-tier-model-delegation-pattern]
---

Three-agent model split (user-designed):
- **Lead (Fable)**: Reads governing docs, writes work orders, arbitrates findings, holds all git (commits/PRs/merges)
- **Implementer (Opus)**: Builds and executes fixes; context persists across session resumption without re-derivation
- **Reviewer (Opus)**: Independent review pass; reproduces bugs, writes proofs, probes edge cases

Agents named and resolve from `.claude/agents/`.

**Why:** Independent reviewer catches bugs invisible to implementer's own test suite. Across 5 tasks (232, 233, 254, 256, 248): found runaway rebuild, privacy leak, extraction gap, install-path data corruption. Two-pass discipline prevents issues shipping.

**How to apply:** Expect agents to resume with full context intact; coordinate findings through lead; use reviewer's independent pass to validate fixes beyond implementer's gate.
