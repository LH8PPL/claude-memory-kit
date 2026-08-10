---
id: P-GBLJYLQ6
type: project
shape: Timeless
title: Avoid Test Folder Contamination During Agent Sessions
created_at: 2026-07-09T06:15:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c6311e05caec5edec801fa7a7de3e91042d274826557794ac3c1183362e57a4b
related: [cutgate-fresh-install-test-sequence, nested-claude-spawn-timeout-in-test-harness, multi-gate-release-verification]
---

Running CLI checks inside a test folder while an agent is actively running pollutes turn-files with non-user content. The auto-extract system correctly identifies contaminated turns (outputs `nothing_durable`), but this can appear as a false bug. Solution: Keep CLI verification outside the test folder; run verification after the agent session completes.

**Why:** Previous Kiro gate rounds confused contamination artifacts with extraction system bugs.

**How to apply:** Use a three-phase pattern for agent tests: (1) run agent session, (2) exit agent, (3) run CLI verification. Don't mix phases.
