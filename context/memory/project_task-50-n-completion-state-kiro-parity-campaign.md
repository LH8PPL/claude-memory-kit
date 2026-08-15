---
id: P-322V34Q2
type: project
title: Task 50.N Completion State — Kiro Parity Campaign
created_at: 2026-06-25T08:39:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8d004038db37d8b2b4c8ac1c931074b14a0a7bcb383752025df070aaeefb5232
related: [kit-status-after-cut-gate-core-merged-and-proven, d198-shipped-pr225-kiro-cli-capture-inject-proven-live, agent-capture-inject-proven-live-across-claude-code-kiro-ide]
---

**kiro-CLI core (fully live-verified, merged):**
- Explicit tools support: #226 (D-199)
- Automatic capture + auto-extract + wedge: #227 (D-200)

**Parity legs (all merged):**
- Prompt-capture (`<private>`-strip), CLI+IDE: #228
- Observe-edit (PostToolUse), CLI: #229
- IDE v1 hook migration + guard + observe: #230
- Parity validator + profile reconcile: on main

**Kiro IDE verification status:**
- Structurally wired + unit-tested (2302/0 passing)
- 5 v1 behaviors are BLOCKING cut-gate criteria, not just nice-to-haves (auto-load, PreToolUse argv/exit/timeout, PostToolUse payload, Stop trigger, inject)
- NOT live-fired yet — unit green ≠ cut-gate ready

**Pre-release checklist:**
- Real tier backup: `run4` exists and verified safe
- Pending: live cut-gate (IDE probes KHv1 + E1/KU1/KU2), restore real tiers, push v0.4.0 tag
- Documentation: committed + current (DECISION-LOG, CHANGELOG, README, tasks.md)

**Why:** Next session will resume from exact state. IDE appears structurally done but live verification is the actual done-gate. Backup location + test count critical for safety.

**How to apply:** Before IDE cut-gate session, confirm backup still exists and suite still 2302/0; treat unit tests as necessary but not sufficient for release readiness.
