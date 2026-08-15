---
id: P-R33XHPD9
type: project
shape: Timeless
title: Cut-Gate Structure Convention
created_at: 2026-07-04T07:39:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0c990209438aa210d7bfd784fe391c8eba84eade7640be029d183ba29600dd07
related: [cut-gate-backend-pattern-template-4f, when-creating-a-cut-gate-for-domain-spec-rjrpeamc, platform-specific-cut-gate-structure-and-scope]
---

Cut-gates have a consistent §0–§9 structure. Sections categorized as:
- **Agent-neutral sections** (capture checks, digest, persona-promotion, temporal-validity, feature sweep, portability): byte-faithful across all variants
- **Tool-specific sections** (§0b, §1, §2, §5–§7): customized per tool/platform
When creating a domain-specific gate (Cursor, Kiro, etc.), copy the full regular cut-gate.md structure, preserve agent-neutral sections exactly, and customize only the listed tool-specific sections.

**Why:** Ensures consistency, maintainability, and comprehensive coverage across all gate variants. Prevents scope creep or accidental omission of critical sections.

**How to apply:** For the next domain gate, copy cut-gate.md in full, keep agent-neutral sections unchanged, and modify only the tool-specific sections (§0b, §1, §2, §5–§7) for the new tool.
