---
id: P-KM5aH7Z7
type: project
shape: State
title: Verified Codebase Consumers of Hook/Snapshot Fields
created_at: 2026-07-04T05:45:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3e8b0cf96360feb82a28093d12f05b8a01dd03fda3f9672daa60902dd2b7076d
related: [memory-tier-flushing-rules, research-notes-indexed-via-research-index-not-documentation, kiro-cli-agent-configuration-and-verification]
---

Three identified callers of hook/snapshot data (blast radius verified clean):
- Claude bin — reads `.hookOutput`
- Kiro leg — reads `.snapshot`
- Cursor leg — reads `.snapshot`

No other consumers reference these fields.

**Why:** When modifying `.hookOutput` or `.snapshot` structure, all three consumers must be updated to avoid breakage. This is the complete dependency graph for these fields.

**How to apply:** Before shipping any change to these fields, verify all three consumers are compatible. Use blast radius check to confirm no undocumented dependencies exist.
