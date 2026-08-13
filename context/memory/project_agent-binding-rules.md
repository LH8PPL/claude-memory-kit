---
id: P-JQ2ZNFKR
type: project
shape: State
title: Agent Binding Rules
created_at: 2026-07-22T16:04:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: be4cecb00f36ac657c170302c7506c11266d84c356f73d80fa7836d4c4b55bd8
related: [standing-outward-step-rule]
---

Each agent definition includes role-scoped binding rules:
  - TDD, five doors, honest work-report format
  - No git operations (clone, push, commit, branch management)
  - No memory-file edits (memory state remains with lead)
  - Mechanic (Sonnet) must stop-and-report on judgment calls
  - Merge decisions and git state stay with lead

**Why:** Keeps deployment, memory, and decision authority centralized; preserves audit trail.

**How to apply:** Review agent outputs for compliance with these rules; do not remove them without explicit decision.
