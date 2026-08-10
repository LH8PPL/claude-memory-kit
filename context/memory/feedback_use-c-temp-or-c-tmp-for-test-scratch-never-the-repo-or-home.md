---
id: P-ZP3ZaPC9
type: feedback
title: use c-temp or c-tmp for test scratch never the repo or home
created_at: 2026-06-26T09:56:56Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 1b234282251bc40a1290b62a5cda4c5c0e576adcc9942dfd661b73437a3f3fbe
related: [always-fix-markdown-lint-warnings-md022-blanks-around-headin, back-up-the-user-tier-before-a-cut-gate-never-plain-delete, bash-tool-cwd-persists-cd-into-a-workspace-silently-reroutes]
---

For ad-hoc test/repro scripts + scratch files, NEVER use the dev repo path (C:\Projects\claude-memory-kit) or the home dir (~ as the working/output location — always use c:\temp or c:\tmp.

**Why:** The user rejected a repro that ran inside the repo dir, with the standing rule: never use C:\Projects\claude-memory-kit or ~ for testing. Scratch/repro files must not pollute the repo (git noise, accidental commits) or the home dir.

**How to apply:** When writing a one-off repro/probe/scratch script or its output, put it under c:\temp or c:\tmp (mkdir if needed), not the repo and not home. The kit's own sandbox tests already use os.tmpdir(); this rule is for MY manual diagnostic scripts.
