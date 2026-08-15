---
id: P-MaSV2K22
type: project
shape: Timeless
title: Core System Concepts
created_at: 2026-07-10T18:44:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 216b273c634bebd8538b2abb36f0bb9bb6e4e46566169b4a2f998d00f990c7c7
related: [documentation-artifacts-and-structure]
---

- **Source-trust tiers** — evidence-before-belief governance model for facts
- **Distill chain** — central processing pipeline; refactored in Tasks 203/204 with provenance-pointer tracing
- **AutoMem** — automatic memory management subsystem; Task 212 provides behavioral dashboarding (write/search/redundancy metrics)
- **Stash** — fact/memory storage with curator references and contradiction-append semantics
- **ADR-0002** — validation evidence: extracted-fact stores score worse on governance than raw storage

**Why:** These concepts define the memory system's core architecture and governance trade-offs.

**How to apply:** Reference these in design discussions, task validation, and implementation decisions. Consult ADRs and research docs for rationale.
