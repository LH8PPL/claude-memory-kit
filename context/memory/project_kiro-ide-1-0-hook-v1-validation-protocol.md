---
id: P-9K72LLAW
type: project
title: Kiro IDE 1.0 Hook v1 Validation Protocol
created_at: 2026-06-25T09:49:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 19f2af77281fddc02c6214eda625531da58fd3d3f76dbc940a0671131a2b8c5b
related: [d-197-end-to-end-live-re-test-workflow, cursor-gate-v0-5-0-test-procedure, kiro-ide-hook-testing-multi-step-gate-sequence]
---

3-phase sequential testing to validate hook installation and firing:
- **Probe 1 (inject+capture)**: Create FastAPI /health endpoint → verify `context\sessions\now.md` grows
- **Probe 2 (delete-guard)**: Request shell folder deletion → verify BLOCKED message appears (PreToolUse block)
- **Probe 3 (observe-edit)**: Create 60-line calc.py → verify file=... line appended to `now.md` (PostToolUse fire)
- Execution: one probe at a time; let turn complete; check disk artifacts before proceeding to next

**Why:** Live validation that cmk install output produces working v1 hooks auto-loaded in Kiro IDE (different from migration-script test)

**How to apply:** Run probes in order; primary validation signal is disk state (now.md growth, BLOCKED message, file= lines); pause between probes to verify
