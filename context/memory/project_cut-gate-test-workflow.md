---
id: P-YHQU4aTH
type: project
title: Cut-Gate Test Workflow
created_at: 2026-06-18T08:28:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c6f4cbe7f2097248aadf79516a3c17bf5de5893672d67e66ef9c9af0ddb403c7
related: [cut-gate16-test-workflow-phases, gate-testing-isolated-throwaway-folders, cut-gate-sandbox-isolation]
---

- **Backup:** Before testing, user renames ~/.claude-memory-kit to before-cut-gateN-.claude-memory-kit
- **Project location:** Tests run in sequential C:\Temp\cut-gateN folders (e.g., cut-gate15, cut-gate16)
- **Work split:** Assistant runs §0/§1/§4/§4c (terminal/file checks); User runs §2/§3/§4b (VS Code/manual)

**Why:** Established pattern used consistently across 15+ test runs; proven reliable

**How to apply:** For each cut-gate test cycle, user backs up real ~/.claude-memory-kit; assistant creates next-sequence C:\Temp folder and runs automated phases; user opens VS Code on that folder for manual phases
