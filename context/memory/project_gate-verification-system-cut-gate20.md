---
id: P-WPYWZW2U
type: project
shape: Timeless
title: Gate Verification System (cut-gate20)
created_at: 2026-07-06T12:54:26Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ca4cd9e097a45eb32c5e0112c8f496c22085721232c390149f36c5887d335f0f
related: [cut-gate-pre-release-validation-checklist-g0-g7, pre-session-1-gate-procedure-v0-4-1, release-gate-cut-gate-guide-must-pass-before-tagging]
---

cut-gate20 uses a hierarchical gate verification system with two phases:

**Pre-Session checks (§0-§1):** G0 (version), G1+BK1 (doctor/backend), G2 (memory-write safe), G2b (memory-search read-only), G3 (CLAUDE.md slim), G4 (leak detection—3 tiers), G5 (hooks+allow-list), G6 (MCP registered), G7 (semantic hybrid), BK1-BK4 (backend gates incl. kiro-cli + cursor-agent compression).

**Post-Session checks (§3):** capture-verification file checks (did auto-extract fire, preference shape/trust, backend-relative auto-extract, no leaks).

**Why:** Project requires reliable verification that the live Claude Code session environment is safe, captures are correct, and no sensitive data leaked.

**How to apply:** Before running any live session, run all §0-§1 gate checks. After a session completes, run §3 capture checks. Fix any failures before proceeding.
