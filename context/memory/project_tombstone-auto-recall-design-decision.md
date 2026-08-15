---
id: P-SURaZQS4
type: project
title: Tombstone Auto-Recall Design Decision
created_at: 2026-06-16T14:05:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d541fa5a4ed96d504f02a672b25cb15f2dab36caec19cfe81b15857448f2bde6
related: [auto-recall-agents-are-blind-to-tombstoned-facts, codeql-action-workflow-bumps-held-by-standing-rule, near-duplicate-handling-in-autolink]
---

Tombstones (soft-deleted records) are kept invisible to the auto-recall system. Recovery of tombstoned data is human-only, explicit opt-in.

**Why:** Respects user intent and data integrity—deleted records should not auto-surface in the AI system.

**How to apply:** When building features interacting with tombstones, assume auto-recall will never surface them. Recovery requires explicit user action.
