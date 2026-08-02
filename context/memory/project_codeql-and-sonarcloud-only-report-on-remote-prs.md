---
id: P-DQJZRGET
type: project
shape: State
title: CodeQL and SonarCloud Only Report on Remote PRs
created_at: 2026-08-02T18:19:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7827105f0d9d6db8e0d3e2b842c62e7f62f20d28604b4ce7c2412ab078bbf309
---

These tools do not surface issues in local runs, only in remote PR checks. This was discovered when multiple local gate cycles appeared to pass while remote CI caught issues.

**Why:** Local validation cycles against these tools waste time — they don't report locally. The team learned this pattern through this debugging round.

**How to apply:** Push to PR early and review CodeQL/SonarCloud output on the remote PR before merge, rather than attempting to validate them locally first.
