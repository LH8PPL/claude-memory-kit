---
id: P-Ta2AAA4Y
type: project
shape: Event
title: Kiro CLI Backend — Live Probe Confirmed Working
created_at: 2026-07-04T10:25:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: db030fd3dfb67eac364eb192e8af4dc3aaab3780d0935b95625c989f8d9ccd19
related: [hook-recursion-guard-cmk-backend-spawn-environment-variable, cursor-agent-backend-doc-confirmed-feasible-not-yet-live-tes, kit-compatibility-requirement-clarified]
---

Kiro is installed on this system. Key findings from live probe:
  - `kiro-cli chat --no-interactive --model claude-haiku-4.5` works as one-shot LLM
  - Cost: ~$0.01 USD per call; latency: ~1 second
  - Auth: via Google login (no API key needed)
  - Output: clean answer on stdout; TUI spinner noise on stderr (ANSI-coded)
  - Parsing: strip ANSI codes and `> ` prompt marker from stdout
  - Recursion guard proven: `CMK_BACKEND_SPAWN` env var checked at dispatcher entry; when set, inner hooks become no-op

**Why:** Task 200 research confirmed Kiro viability as background LLM backend; recursion hazard was the critical unknown and is now solved

**How to apply:** Use these exact specs when implementing KiroCliBackend in Task 200 build phase; set CMK_BACKEND_SPAWN when spawning the backend
