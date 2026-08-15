---
id: P-LERWEE52
type: project
shape: State
title: Task 174 Deliverable Structure
created_at: 2026-07-20T13:49:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4b401244279a9f61526e9a947831a56769340138ec63b6d7d01b854e463922df
related: [git-as-sole-evidence-in-gap-cases, mcp-prompt-root-cause-agent-config-kiro-cli-mismatch]
---

- **Real deliverable**: the cron sweep (D-169), which runs `dailyDistill()` and fills gap days automatically.
- **Manual override**: `cmk backfill` command (only for testing / one-off runs).
- **Gap definition**: days with no harness session. Harness transcript can't cover gaps (covers 0 of 35 gap days).
- **Only evidence in gaps**: git history (harness is rich but only works when a session exists).
- **Safety**: reconstructions marked, real log never overwritten, idempotent, fail-open, timeouts on git reads. 3238/3238 tests green. Live validation: 20 gap days found on current repo.

**Why:** Understanding the deliverable structure (what runs automatically vs manually, why git is the only source) is essential for maintenance and future iterations.

**How to apply:** When extending Task 174 logic, remember the cron is the primary mechanism; git history is the sole evidence *in gap cases* (not a general option among several); harness richness doesn't help gaps.
