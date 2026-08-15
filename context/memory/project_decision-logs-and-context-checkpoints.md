---
id: P-4E9E9P42
type: project
title: Decision Logs and Context Checkpoints
created_at: 2026-06-22T17:23:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e1585262c74194dbd364b28a58692805c11056d77366688c094b8506a12105cc
related: [documentation-artifacts-and-structure, public-repo-memory-policy, index-md-is-a-committed-human-readable-artifact]
---

Project uses RESUME-HERE.md file and numbered decision items (D-###: D-192, D-193, etc.) to persist decisions and state across context compactions. Decision log items track major incidents, follow-ups, and key choices.

**Why:** With large codebases, Claude's context is periodically compressed. Decision logs and checkpoint files provide durable recovery points outside the conversation thread.

**How to apply:** On session resume or after context compaction, check RESUME-HERE.md and any D-### items to recover full project state and decision history.
