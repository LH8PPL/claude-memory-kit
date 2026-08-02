---
id: P-DU7X5SA6
type: project
shape: State
title: Troubleshooting Skill Architecture — Shape (b) Confirmed
created_at: 2026-08-01T12:53:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 53240cdd7702153905fa2320e8832bf6d030508cd9b94173a963bfdc6c78bc1e
---

User selected per-code repair book shape for core-memory-kit troubleshooting skill.

**What this shape does**:
- Each failure code (`agent-cli-missing`, `hooks-unregistered`, etc.) maps to repair entry with symptom, diagnosis command, exact fix, and safety class
- Model references keyed entry instead of re-deriving fix each time

**Confirm-first discipline**: Fixes touching user-owned state (settings.json, reinstalls, destructive ops) are proposed to user for approval—never auto-run. Implements "kit proposes, user owns" principle.

**Scope**: Kit-failure-codes only; general "how to use cmk" remains in docs; doctor command fallback for unknown codes.

**Why:** Confirmed over shape (a) generic diagnostician; enables efficient fix routing while preserving user control

**How to apply:** Build per-code repair book keyed by failure code; embed confirm-first checks; ensure all kit failures have entries; test doctor fallback
