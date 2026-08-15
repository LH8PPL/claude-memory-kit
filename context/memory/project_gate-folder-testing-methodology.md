---
id: P-F2GYBEY5
type: project
title: Gate-Folder Testing Methodology
created_at: 2026-06-24T19:07:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: abbadb08665942082be11c6591d432947a3e0b9dfb985251ffc44755e23b75f8
related: [gate-testing-isolated-throwaway-folders, live-test-workflow-for-kiro-cli-project-fix, test-gate-folders-use-numbered-sequence]
---

Use numbered test folders (`gate7`, `gate8`, etc.) to isolate each fix and validate behavior incrementally. Each gate:
- Starts fresh (`mkdir`, `git init`, `cmk install`)
- Tests a single isolated concern (bare command vs. flagged command)
- Produces a clear pass/fail signal
- Feeds into a conditional cleanup decision

**Why:** Numbered gates decouple testing from active development and make regression detection obvious. The pattern is repeatable and traceable.

**How to apply:** For the next validation cycle, use `gate9`, `gate10` etc. in `C:\Temp\`. Each gate folder's behavior determines whether to commit or roll back the corresponding code change.
