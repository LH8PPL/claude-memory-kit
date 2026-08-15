---
id: P-PaVAMD9H
type: project
title: Pre-gate rebuild and server shutdown sequence
created_at: 2026-06-25T08:46:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d020f09a9fcbd1fca300e146c5d8fb8f996a31b25e41e8b92c435ebbfacbc335
related: [kg-guard-retest-failed-was-stale-artifact-not-fix, re-pack-verify-workflow-for-cut-gate-testing, rebuild-global-cmk-cli-binary-release-process]
---

**User runs:**
1. Kill cmk MCP server (it locks `better_sqlite3.node` → EBUSY during npm install):
   ```powershell
   Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'claude-memory-kit' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
   ```
2. Rebuild global cmk from current main (it may silently retain old code; verify after):
   ```powershell
   cd C:\Projects\claude-memory-kit\packages\cli
   npm pack
   npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz
   cmk --version
   ```
3. Fully close Kiro IDE + any kiro-cli session (so they re-read config fresh on next start)
4. Signal **"rebuilt"** to trigger assistant automated backup + fresh install + on-disk checks

**Then assistant runs** (automated):
- Verify rebuild took (confirm 50.N.1 + 50.N.3 present — last time it silently kept old code)
- Backup user tier into `C:\cut-gate-backups\`
- Fresh `cmk install --ide kiro` in throwaway gate project
- Run on-disk checks (KCG1-8 / KG5 / IDE file checks)

**Why:** npm can silently retain old code; MCP locking prevents clean rebuilds; user state must be captured before fresh install; on-disk checks reduce manual gate work.

**How to apply:** Run steps 1–4 exactly as written. After signaling "rebuilt", wait for assistant confirmation before driving the live chat part. Do NOT skip the `cmk --version` verification.
