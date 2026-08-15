---
id: P-UPNQSMQS
type: project
shape: Timeless
title: Memory Safety Guard Prevents Agent Bypass Attempts
created_at: 2026-07-22T08:27:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2acdd5f337192a6c90496f90716d8b7400110e09006e2d54345bab59f18a975a
related: [delete-guardrail-memory-protection-via-pretooluse-hook, kit-delete-guardrail-false-positive-on-commit-messages, kit-shell-permission-command-trust-boundary]
---

The core-memory-kit implements guards (D-192, D-193) that prevent agents from destructing memory files or directories, even if the agent attempts alternative shells or rerouting. This is intentional and designed to prevent accidental data loss.

**Why:** Memory systems require strong protections against agent-initiated destructive operations. The guard correctly blocks the agent, leaving such operations to the user.

**How to apply:** When memory-related deletions are necessary, the agent will be blocked. The user must run destructive commands directly outside the agent runtime (e.g., from the shell).
