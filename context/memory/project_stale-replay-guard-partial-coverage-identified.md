---
id: P-9YPXRSQM
type: project
shape: State
title: 'Stale-Replay Guard: Partial Coverage Identified'
created_at: 2026-07-20T12:51:00Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5563fde62d6ed0a8e21bed2d13018f9e3bd1afcdee5fb4b2dece542e735a6952
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, test-suite-isolation-guard-required-known-risk, v0-4-5-kiro-cli-dispatch-guard-implementation]
---

**Task 234** introduces a stale-replay guard labeling `Active Threads` as *"may already be done; verify before acting"*. This prevents the injected snapshot from becoming silently outdated. **Gap:** The guard covers the injected snapshot but not the working todo list itself—in-session working lists can still diverge from memory independently.

**Why:** In this project, memory is the canonical state. Working lists can rot without active verification. The current guard is a safety net for one state path but doesn't cover working lists.

**How to apply:** Treat in-session working lists as provisional; verify against memory before acting on work items carried from prior sessions.
