---
id: P-KC3D9H6L
type: project
shape: Timeless
title: Architecture Decisions via ADR References
created_at: 2026-08-01T12:51:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d0f8537f24086ec133393a54bacbf195d54c10a0815dfdbdce1387f232caf868
---

- ADR-0002: forbids two-writer hazards (read-modify-write on shared state).
- ADR-0018: "kit proposes, user owns" — destructive operations must be confirmed before execution.

**Why:** Project uses ADR (Architecture Decision Record) pattern to document and enforce design principles consistently.

**How to apply:** When proposing changes involving concurrency or destructive ops, reference and comply with these ADRs; cite in design docs and PRs.
