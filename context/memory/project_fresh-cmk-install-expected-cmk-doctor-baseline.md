---
id: P-EHXTGB2K
type: project
title: 'Fresh CMK Install: Expected `cmk doctor` Baseline'
created_at: 2026-07-01T06:20:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: baf8b8a70ea47557c686c843acb16a4f97082a90a4da7b296bc59cc00d36fbb4
related: [claude-memory-kit-health-check-suite-hc-1-through-hc-9, fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic, 1-gate-run-verification-expected-health-checks-and-session]
---

A brand-new project (`cmk install --with-semantic` in a fresh git repo) produces `cmk doctor` results: **6 pass · 0 fail · 4 skip**. The 4 SKIPs are not failures — they indicate features not yet active:

- HC-2 (daily distill): no session content yet
- HC-3 (transcripts): no Claude Code turns yet  
- HC-5 (cron jobs): optional; lazy-on-read fallback in use
- HC-10 (scheduled compaction): optional; self-heals each session

**HC-9 (scaffold version match) must PASS** — confirms the project scaffold version shipped with cmk matches the installed cmk binary. Critical for v0.4.3 integrity.

**HC-8 (native bindings + embedder) must PASS** — confirms better-sqlite3 and the semantic embedder load, enabling hybrid search.

**Why:** Future sessions running cut-gates or debugging health issues reference this baseline. A fresh install is healthy if it matches this pattern. HC-9 is essential for confirming v0.4.3 deployment integrity.

**How to apply:** When running `cmk doctor` on a fresh project, expect 6 pass, 4 skip — this is normal and healthy. Investigate any FAIL results; SKIPs are expected. Monitor HC-9 and HC-8 specifically as version/capability markers.
