---
id: P-YMYUa2QG
type: project
title: HC-1 False-FAIL on Kiro (Recursive Agent-Awareness Bug)
created_at: 2026-06-21T15:45:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f96ff876dd13254c6105978d783efae66c27cb9258e7b836d22c0b39a5d12d8c
related: [live-test-gate-structure-and-blocker-findings, kiro-install-contains-two-independent-clients-with-separate, kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook]
---

The `cmk doctor` HC-1 check had a nested bug in agent-awareness, caught only during skill-review:

- **D-185:** Made doctor agent-aware so HC-1 recognizes IDE-hook agents. Fixed the immediate false-FAIL on Kiro.
- **D-186 (skill-review catch):** D-185 only checked the IDE-hook surface; a CLI-agent-only user (agent in ~/.aws, no IDE hooks) still false-FAILed. This is the same "separately-correct-jointly-broken" pattern, recursed one level. Fixed HC-1 to true capability check: PASS if (IDE hooks OR CLI agent), FAIL only if neither.

Live-verified: full install → "IDE + CLI" (PASS); IDE-hooks-removed → "CLI only" (PASS, not false-FAIL).

**Why:** Skill-review caught a real cut-blocker self-review missed. The gate's output validity depends on doctor being correct across all agent surfaces. Hidden sub-bug within a fix.

**How to apply:** When reviewing agent-awareness logic, test all agent surfaces independently. Watch for fixes correct on one path but incomplete on another. Document the full capability matrix.
