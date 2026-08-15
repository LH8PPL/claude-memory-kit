---
id: P-BPSaKX7V
type: project
title: Release Workflow with Destructive Manual Steps
created_at: 2026-06-17T08:10:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 86b2738dea49cb818bd1685da8b284a102379185c23f1e2527d558fa422a23c7
related: [version-0-3-3-release-cut-gate16-test-session-state, release-gate-cut-gate-guide-must-pass-before-tagging, deciding-experiment-that-gates-v0-3-1]
---

claude-memory-kit v0.3.3 has a staged release with:
- Behavioral gate tests (DJ4-live, F-7b-live, M0-M3, D1, W1-W4, R2-R3, D4-D5) — all now concrete (PASS/FAIL + prompts)
- Destructive operations: replacing global `cmk` install + wiping `~/.claude-memory-kit` (requires persona backup)
- Manual testing gate before tag push
- Three execution scopes: Hold | Safe-only (verify 0a + npm pack) | Full (including global install + wipe)

**Why:** Workflow has irreversible steps; next session needs to know the release is staged but requires explicit user choice on scope before proceeding

**How to apply:** Before executing any part of the release, confirm with user which scope (A/B/C) they authorize
