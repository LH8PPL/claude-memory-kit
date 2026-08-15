---
id: P-59BaaLDa
type: project
shape: State
title: Kiro IDE and kiro-cli Have Different Hook Architectures
created_at: 2026-07-06T17:16:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d332055c8716c68b921012dcaeade93c90cebac97c2e97f966ee7ff713a0377d
related: [kiro-cli-agent-resolution-requires-global-default, kiro-install-contains-two-independent-clients-with-separate, kiro-agent-must-be-global-empirically-validated]
---

- Kiro IDE stores hooks in project files (`.kiro/hooks/*.json`) — auto-fires, no global setup needed
- kiro-cli stores hooks in agent configs (`~/.kiro/agents/cmk.json`) — requires global default-agent to auto-activate
- `cmk install --ide kiro` handles both: project files for IDE, agent setup for CLI

**Why:** The two Kiro clients have opposite designs. Previous context (D-283/D-284) covered kiro-cli only; IDE works like other IDEs (project-level files).

**How to apply:** IDE users get auto-activated hooks from `.kiro/hooks/`. CLI users still need the global default-agent. One install covers both.
