---
id: P-NU2K2NN9
type: project
title: Validation Pipeline for claude-memory-kit Includes Format and Privacy Gates
created_at: 2026-06-14T12:52:47Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b76b8918c1ec2fdf02d8cd1448befb50da1419923220fb7d3877ea40166f03e1
related: [full-gate-re-run-on-final-code-after-code-review, validator-pattern-structural-guards-in-test-suite-task-128-r, stress-test-gating-rule-for-pr-approval]
---

Pre-commit validation catches two classes of issues:
- **Format/limit validator** — catches schema violations (1024-char skill description limit)
- **Privacy validator** — blocks names/tokens from being committed (caught a personal-wiki path reference)

Both validators are integrated into prerun checks and stress-test flow.

**Why:** Preventive gates catch issues before code review, reducing back-and-forth and avoiding silent failures (1024-char limit would cause skill to silently fail to load).

**How to apply:** Treat validator feedback as critical path, not optional checks — run prerun (catches privacy), verify doc limits (e.g., 1024-char spec), and stress suite before merge.
