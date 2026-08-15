---
id: P-L6JWNSFM
type: project
title: 'Gate/Restore Logic: q_cli_default.json Presence Determines Behavior'
created_at: 2026-06-21T15:01:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6885d3f57de196195bfbd35e62ad8a121542efed77de76696fa55f11d324713f
related: [test-artifacts-can-contaminate-fresh-install-testing, kiro-gate-0c-backup-recovery-procedure, kiro-cli-agent-config-reads-from-kiro-agents-not-aws-amazonq]
---

Whether a `q_cli_default.json` file exists in `~/.aws/amazonq/cli-agents/` **before** running the gate determines:
- **KG1 expectation:** whether to expect a "you already have a Kiro default agent" note or silent-default path
- **Restore behavior:** whether the restored `q_cli_default.json` is left (user's existing file) or deleted (ours from the capture)
- This single fact is critical for deciding post-gate cleanup and recovery steps

**Why:** The capture/restore logic is conditional on pre-gate state; the guide needs users to record this fact in NOTES.md

**How to apply:** Always check and document `~/.aws/amazonq/cli-agents/*.json` presence in NOTES.md before gate starts; use that to decide which restore path to take later
