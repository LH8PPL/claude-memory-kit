---
id: P-74QJEBLW
type: project
shape: Absence
title: cut-gate-kiro.md Lacks Clear Documentation of Two-Client Testing Across Sessions
created_at: 2026-07-09T14:52:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8375781d0e2cb5f3015ba9fad553868770e62ceaa73b1705aa7d04a82526c8dd
related: [cut-gate-kiro-deliberately-tests-both-kiro-clients-across-th, cut-gate-validation-includes-paraphrase-recall-check, claude-memory-kit-supports-3-ide-tool-agents]
---

- **Problem**: The guide's title ("cut-gate-kiro", singular) and session numbering (1/2/3) obscure that Session 2 switches from IDE to CLI. Readers expecting an "IDE gate" may be confused.
- **Proposed fixes** (per assistant, pending confirmation):
  - Rename section headers: "§2 Session 1 (Kiro IDE)", "§5 Session 2 (kiro-cli)", "§6 Session 3 (cold-open, either client)"
  - Add a one-line "two clients, three sessions" map at the top of §2.

**Why:** Clear documentation prevents confusion and sets correct expectations for gate runners.

**How to apply:** Apply clarity edits to cut-gate-kiro.md before running §5 and §6.
