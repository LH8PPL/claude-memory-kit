---
id: P-TTKBJN2D
type: project
title: Cut-Gate Testing Structure (Terminal vs Live-Session Gates)
created_at: 2026-06-17T08:20:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8c689e7035235804278e818436d9429faf421af5c8337440c43a0cf1f64d0142
related: [version-0-3-3-release-features-and-test-coverage, gate-verification-system-cut-gate20, cut-gate16-test-workflow-phases]
---

Cut-guide.md has 10 sections (0–9). **Sections 0–1** are terminal-runnable (install + scaffold): gates G0, G1, G2, G2b, G3, G4, G6, G7. **Sections 2–9** require live Claude Code sessions: DJ gates (digest/journal), F gates (tombstone-recovery), M gates (MCP conversational), W gates (recall ladder).

**Why:** Determines what can run in CI/headless vs what needs user interaction; gate placement guides future test additions

**How to apply:** When adding new gates, place terminal-only checks in §0–1 and interactive/session-dependent gates in §2–9. Do not mix.
