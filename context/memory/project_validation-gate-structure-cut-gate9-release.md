---
id: P-aN9PaSGC
type: project
title: Validation Gate Structure (cut-gate9 Release)
created_at: 2026-06-11T11:59:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 18bf778346aaa3c7d5081d2e170625c3b01af5fe
related: [live-test-gate-structure-and-blocker-findings, two-sub-test-method-for-isolating-skill-permission-gating, claude-memory-kit-gate-test-phase-structure]
---

Release validation is gated through numbered check groups:
- **G1-G7**: File-side checks (configuration, allow-list entries, skills, doctor)
- **B1-B4**: Behavior/functionality (autocapture with dedup, rich facts, persona promotion at trust:high, privacy/security gates)
- **D1**: Data recall (5/5 tests)
- **R1-R2**: UX & in-session feel (manual hands-on testing phase)
- **W1**: Skill gate (prompt-free skill fire)

Progression: Automated gates (G, B, D) must pass before manual testing (R, W). Release clearance is "full green" on all automated checks.

**Why:** Standardized gates catch regressions; each check owns a specific concern. Automation verifies what it can; in-session UX and skip-prompt behavior require hands-on testing.

**How to apply:** Use these labels when discussing validation progress. When you see "29/29 pass," that's all G/B/D checks. Next phase (R1-R2) is hands-on testing in the live session.
