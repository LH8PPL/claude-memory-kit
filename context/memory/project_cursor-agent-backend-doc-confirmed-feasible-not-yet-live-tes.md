---
id: P-3C25GB4L
type: project
shape: State
title: Cursor Agent Backend — Doc-Confirmed Feasible, Not Yet Live-Tested
created_at: 2026-07-04T10:25:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 12d1a46c15ceecedadaf209437638b0535e0fe7d38a92d292fb35fa121523c54
related: [kiro-cli-backend-live-probe-confirmed-working, task-200-build-phase-implementation-roadmap, cursor-agent-automation-requires-separate-cursor-api-key-no]
---

Cursor agent feasibility assessment:
  - `cursor-agent -p --output-format json` documented to exist
  - Auth: via `CURSOR_API_KEY` environment variable
  - Status: feasible per docs, but `cursor-agent` not installed on this machine
  - Blocker: exact `--model` and `--no-tools` flags need live probe of `cursor-agent --help` during build phase

**Why:** Task 200 assessment of both Kiro and Cursor as backend options; can't confirm flag behavior from docs alone

**How to apply:** Schedule live-probe of `cursor-agent --help` during Task 200 build phase (before full implementation); confirm --model flags and tool-disabling mechanism work as expected
