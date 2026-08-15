---
id: P-ZGJTAGBD
type: project
title: v0.4.0 cut-gate structure and coverage
created_at: 2026-06-25T08:46:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2cb15908c5aabdb12c1360c16c36d8747230594544f2e597a46b1889cf2b3dc0
related: [kiro-cli-dual-emit-architecture, kiro-v0-4-0-multi-surface-trust-mechanism-architecture, kiro-v3-hooks-redesigned-first-class-delete-guard-fallback-t]
---

Three surfaces being gated against their respective probes:
- **kiro-cli (V3 2.9.0)**: full gate with KC1/KC2/KC3 + M-wedge + KG-observe + V3 guard-fallback; covers D-199/D-200 fixes — live/real work
- **Kiro IDE (0.x)**: legacy KH1/KH2 (capture+inject fire) re-confirm on rebuilt global
- **IDE v1 (KHv1-*)**: explicitly skipped (requires IDE 1.0; user on 0.x) — documented, not a blocker

The gate is mostly kiro-cli validation + IDE legacy re-confirm.

**Why:** User's installed versions determine which probes are active vs skipped. IDE v1 is not in scope yet but is explicitly documented as such.

**How to apply:** When running the gate, expect full coverage on kiro-cli, partial on IDE legacy (KH1/KH2), none on IDE v1. Use this table to avoid surprises.
