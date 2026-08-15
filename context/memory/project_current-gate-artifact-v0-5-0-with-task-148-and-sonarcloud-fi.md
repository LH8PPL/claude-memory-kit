---
id: P-735AX2UF
type: project
shape: State
title: Current Gate Artifact — v0.5.0 with Task-148 and SonarCloud Fixes
created_at: 2026-07-08T12:17:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 39fd5a8cc0762114c71f79dcf9b81c3b5599a0c5df0779fec91001320510e057
related: [cut-gate-verification-probes, project-tracking-structure, tarball-artifact-must-carry-both-d-263-and-d-264]
---

Global cmk build is now at v0.5.0 (upgraded from 0.4.4). Verified content:
  - Task-148 markers in transcript-screen.mjs (3 matches)
  - SonarCloud ReDoS/unicode fixes in pii-patterns.mjs (INVISIBLE_CODEPOINT_HEX, 2 matches)
  This is the artifact for the current gate cycle (Sessions 1–3, §0–§5).

**Why:** Anchors artifact version and contents; future sessions can verify baseline without re-deriving

**How to apply:** When resuming gate work, confirm global `cmk --version` = 0.5.0 and scan for Task-148 + SonarCloud markers before running Sessions 2–3
