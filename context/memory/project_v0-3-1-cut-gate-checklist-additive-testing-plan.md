---
id: P-EAALA5AR
type: project
title: v0.3.1 Cut-Gate Checklist (Additive Testing Plan)
created_at: 2026-06-13T13:01:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fcae63f233752a759f570ff9cf37115a08262f1b
related: [v0-4-1-cut-gate-fully-passed-all-cli-sessions-1-3-green-e1-w, resume-v0-3-2-cut-gate-in-progress, resume-v0-3-1-cut-gate-2-bugs-found-fixed-pr-179-in-flight]
---

**Scope:** Rerun full v0.3.0 cut-gate (~70 checks, docs/process/cut-gate.md) as-is, PLUS these v0.3.1 blocks.

**Part A — CLI-reachable (assistant-driven):**
- G1: install + doctor
- NEW-1 (HC-8): native-binding present + PASS
- NEW-2 (D-145): `.gitattributes` with `eol=lf`
- NEW-3 (129): `cmk config` get/set/--show-origin/--local + proto-guard
- NEW-4 (142): `cmk import-claude-md --dry-run` → typed proposals
- NEW-5 (134): Poison_Guard rejects `ghp_` token at real write path
- NEW-6 (137.5): `extract-trend` runs
- Additional: feature sweep (all `cmk` subcommands), B9b trend on populated session, `import-claude-md --yes` end-to-end

**Part B — User-only (real Claude Code session in C:\Temp\cut-gate-v031\proj):**
- Standing (v0.3.0): R1/R2 no console flash, M0/M1/M2 MCP tools + capture + forget, B9 rich fact auto-extract, W1–W4 recall/paraphrase/transcripts/search, D3 recall UX, E1 cold-open persona
- NEW-7 (145): status line visible at session start
- NEW-8 (143): semantic near-dup routes to conflict queue
- NEW-9 (143): `mk_remember` via MCP still works post-refactor

**Part C — Pre-tag:**
- Docs current (README/CHANGELOG)
- B9b trend clears suppressor threshold (after Session 1)

**Critical-path (headline new UX):** NEW-7 (status line) + NEW-8 (near-dup → queue)

**Why:** Ensures every v0.3.x release tests standing regression checks + new-feature validation consistently. Three-part structure (CLI-driven, user-only, pre-tag) is reusable for future releases.

**How to apply:** For v0.3.2 and beyond, rerun v0.3.0 gate in full, append new-feature blocks as Parts A/B/C, call out critical-path items. Cross-reference each test with PR/issue number for traceability.
