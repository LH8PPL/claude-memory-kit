---
id: P-XZSUPBWU
type: project
title: Auto-recall agents are blind to tombstoned facts
created_at: 2026-06-16T11:25:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1e973f3ce9977578a063fcc5140bf2083591209441fa2b29aa88ef13f71f8843
related: [tombstone-auto-recall-design-decision, d-163-invariant-agent-must-never-see-forgotten-facts, automatic-recall-never-reads-tombstones-recovery-is-human-on]
---

When an agent (in-session recall, not a human user) retrieves memories, it never sees tombstoned facts. Deleted facts remain invisible to automatic recall. Recovery of tombstoned facts is always human-initiated.

**Why:** An agent confidently recalling a fact the user explicitly deleted is the worst failure mode a memory product can have. Keeping tombstones invisible to agents enforces the invariant that "forget" is truly permanent from the agent's perspective.

**How to apply:** Ensure any auto-recall mechanism (session-start memory load, in-conversation fact retrieval, agent context-building) filters out tombstoned facts by default. Provide explicit flags (--include-tombstoned) only for human-initiated recovery operations, never for agent use.
