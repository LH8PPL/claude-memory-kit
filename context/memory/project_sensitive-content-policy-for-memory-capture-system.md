---
id: P-4HWRCJBR
type: project
title: Sensitive Content Policy for Memory Capture System
created_at: 2026-06-14T06:33:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3ed963807b89680daa063be18bea9c5541bedd2d
related: [kit-name-privacy-validator-for-auto-extract, cut-gate11-memory-system-three-tier-architecture, dogfood-memory-architecture-session-recall-vs-authoritative]
---

User selected Option A for handling sensitive content detected during auto-memory extraction.
- Content flagged as sensitive is excluded from `context/` (committed tier)
- May fall through to `context.local/` (git-ignored, this-machine-only) if locally useful
- Mirrors Poison_Guard behavior for secrets — maintains consistent risk model across the kit
- Sensitive facts never auto-loaded into session context, never promoted to cross-project tier

**Why:** Ensures personal/sensitive content never silently lands in git-committed, possibly-shared files. Solves the core risk: sensitive data in a repo that might be pushed.

**How to apply:** In auto-extract workflows, route sensitivity-flagged content to local-only storage, never to committed tier. Align with existing Poison_Guard precedent.
