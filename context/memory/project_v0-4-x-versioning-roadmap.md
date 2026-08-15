---
id: P-ZDR9EQRa
type: project
title: v0.4.x Versioning Roadmap
created_at: 2026-06-15T08:14:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 48153672fcae665d7f8f398618c6d293312520c0e15384366d5094bc343c22c4
related: [harness-support-roadmap-task-196-and-versioning-policy, kit-versioning-uses-lane-themed-releases-not-strict-semver, v0-4-6-release-roadmap]
---

- **v0.4.0** = Kiro + per-agent adapter seam infrastructure (seam is the real v0.4.0 work; Kiro is first consumer)
- **v0.4.1** = Cursor (locked)
- **Ordered tail, cut-to-patch on ship** (not pre-numbered): Codex → Antigravity → gemini-cli → opencode → cline/roo/windsurf/…
- Cross-agent breadth is the v0.4 differentiator; subsequent agents are patch-level polish
- Extends D-127 (Kiro-first)

**Why:** Clarifies v0.4.0 ships infrastructure + first integration. Explains tail strategy: agents are patch-level, numbered only at ship time.

**How to apply:** Reference this roadmap when planning Task 50 and v0.4.1+ agent integrations. Verify each new agent against seam infrastructure.
