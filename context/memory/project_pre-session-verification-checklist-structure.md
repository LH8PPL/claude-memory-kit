---
id: P-RP4BG3YM
type: project
title: Pre-Session Verification Checklist Structure
created_at: 2026-06-11T11:35:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c55843474562cf3a15fd07121c61bc55b1b56b6e
related: [multi-gate-release-verification, release-gating-workflow-for-version-cuts, v0-4-1-release-gate-workflow]
---

Pre-session verification for Session 1 has three sequential gates:

**Gate 1: File-side checks** (completed independently, pre-session)
- G0–G7 and artifact integrity (version, install/doctor pass, memory safety gates, scaffold cleanliness, MCP registration, allow-list, tarball completeness)
- Status: all passing ✓

**Gate 2: In-session verification** (user-executed, marked ★)
- `/hooks` command to verify `cmk-*` hooks active
- Open memory once (checks G2)
- W1 (memory-search read-only) fires prompt-free
- W2 (hybrid mode paraphrase) demonstrates recall

**Gate 3: Live-test validation** (automated sandbox, final gate)
- Run live-test against real artifact in sandbox (a few minutes)
- Report: test result + model-cache size
- This result unblocks session1 to proceed

Session1 cannot start until all three gates pass.

**Why:** Multi-stage verification (file-side / in-session / live-test) catches config issues, integration problems, and artifact integrity before release.

**How to apply:** File-side ✓ done. User runs ★ in-session checks next (e.g., `/hooks`). Then await live-test result to clear session1 go-ahead.
