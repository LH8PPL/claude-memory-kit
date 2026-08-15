---
id: P-CGLT2JD7
type: project
title: Memory Persistence Validation Workflow (End-to-End)
created_at: 2026-06-24T14:24:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 098725a4f88e132a0eaa1b06d14e3c91b41a4326b2f7765409f1620431f006e4
related: [kiro-cli-integration-test-gate-and-reinstall, live-test-workflow-for-kiro-cli-project-fix, d-197-end-to-end-live-re-test-workflow]
---

Complete test sequence for validating memory fixes:
1. Rebuild global CLI (see [[Global CLI Rebuild and Reinstall Workflow]])
2. Reinstall in gate: `cd C:\Temp\kiro-cli-gate` → `cmk install --ide kiro`
3. Interactive test: `kiro-cli chat` → state a preference (e.g., "Always use a project-local .venv for Python in this project")
4. Observe assistant response
5. Verify persistence: scan `C:\Temp\kiro-cli-gate\context\` for the fact landing

**Why:** This workflow empirically proves memory persistence works end-to-end. It's the definitive test — if facts land in context/ after a live session, the fix is working.

**How to apply:** Run this after every memory-related code fix. Passing = fact appears in context/. Failing = return to code and iterate. Do not merge until the full sequence passes.
