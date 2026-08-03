---
id: P-GNUDVPYD
aliases: [P-GNUDVPYD]
type: project
shape: Timeless
title: PowerShell Copy-Item Wildcard Risk in Repo
created_at: 2026-08-03T13:58:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3fee21495651420eff25c51946acece28dfe996c45aa17e2e5aec825cbfd0744
---

Running `Copy-Item scratchpad\*.md -Destination .` to move one research note inadvertently copied ~30 unrelated scratch files into the repo root, including a README from a different project that silently overwrote the actual project README. Validators caught it (30 registry + 417 reference + 90 count failures); recovery was via `git checkout -- README.md`. Workaround: write files directly to their final destination instead of staging in scratch and using wildcard copy.

**Why:** This is the second wildcard-related incident this session (earlier: PowerShell UTF-8 encoding corruption). Wildcard operations can pull in unrelated content from mixed directories, causing silent overwrites that only validators catch.

**How to apply:** Avoid `Copy-Item` with glob patterns targeting the repo root. Write directly to the intended destination directory (e.g., `docs/research/`). If staging is needed, explicitly list files instead of using wildcards.
