---
id: P-KHaCEVKE
type: project
shape: Timeless
title: v0.6.0+ Upgrade Verification Matrix
created_at: 2026-07-20T12:46:29Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 03966299f57411ba6065f9b78069f2d1e62c6f8622a6af037b17e717552d2d66
related: [core-memory-kit-installed-with-claude-code-hooks, cut-gate11-pre-session-verification-checklist]
---

After global upgrade, confirm all columns pass: existing search/sqlite/vec0 work, new features appear (date column 4→5 fields, new CLI verbs like cmk tour/expand), scaffold drift resolves (HC-9 FAIL→PASS), scaffolding files created (.claude/commands/tour.md), backend wired (hybrid semantic, claude-code). Zero regression in priors.

**Why:** v0.6.0 introduced new features and fixed issues; matrix catches breakage early in upgrade path.

**How to apply:** Run checklist after each global upgrade before advising users.
