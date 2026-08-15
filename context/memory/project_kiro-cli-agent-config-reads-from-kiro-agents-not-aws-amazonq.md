---
id: P-LZZa6KWT
type: project
title: kiro-cli agent config reads from ~/.kiro/agents/ (not ~/.aws/amazonq/cli-agents/)
created_at: 2026-06-24T09:08:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9f3d1274cfac308fdbe32498a16b583460c89ddf1c29aac4fb3414b5b7ff6137
related: [kiro-cli-agent-configuration-and-verification, d-198-fix-agentspawn-hook-now-fires, gate-restore-logic-q-cli-default-json-presence-determines-be]
---

kiro-cli V3 (2.9.0+) reads agent configs exclusively from `~/.kiro/agents/`. The kit was writing to `~/.aws/amazonq/cli-agents/` (amazonq CLI location), which kiro-cli never reads, causing silent discovery failure. D-198 fixed this by writing to the correct kiro path.

**Why:** Root cause of "cmk agent not firing in kiro-cli" despite D-197's logic fix being correct; explains the "dead file" symptom. Critical for debugging agent-not-found issues going forward.

**How to apply:** When testing/troubleshooting kiro-cli agent discovery, verify config location is `~/.kiro/agents/`. If migrating users from amazonq to kiro-cli, document path move as part of migration.
