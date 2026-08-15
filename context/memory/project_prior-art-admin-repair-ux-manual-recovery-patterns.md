---
id: P-J3Z5CEVR
aliases: [P-J3Z5CEVR]
type: project
shape: Absence
title: 'Prior-Art Admin/Repair UX: Manual Recovery Patterns'
created_at: 2026-08-15T08:52:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9ef3e985ba7c26ce905b5664cbfb23aa3f6be9c602d51f1183aeb8774685aaf6
---

Prior art in the codebase for manual operational repair:
- `reembed-all` — bulk re-embedding
- `retry-failed` — retry failed operations
- `reset-stuck` — manual unstick for stuck states

**Why:** Validates operational repair as a solved problem in prior work; provides design precedent for our manual-maintenance UX.

**How to apply:** Reference when designing corpus-management admin commands; these patterns are proven operational solutions.
