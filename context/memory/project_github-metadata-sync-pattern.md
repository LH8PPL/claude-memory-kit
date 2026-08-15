---
id: P-4aFAT7U2
type: project
shape: Timeless
title: GitHub Metadata Sync Pattern
created_at: 2026-07-15T13:53:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a793f13e5f7d701f64ede0776b9060c85138b97adf1f389fe85888ad6bbb832c
related: [canonical-agent-support-list, claude-memory-kit-supports-3-ide-tool-agents, multi-surface-documentation-architecture]
---

Multiple metadata surfaces track the same configuration facts:
- README.md (primary source)
- CLI help/docs (reflects README)
- GitHub repo About description (must match README agents)
- GitHub Topics tags (must include active agent names like `codex`, drop deprecated IDE tags like `kiro-ide`)

These drift out of sync if updated independently.

**Why:** The Codex support shipped in v0.5.2 but GitHub About wasn't updated until this session, creating false inconsistency in public-facing metadata.

**How to apply:** Treat README as authoritative. When adding features or agents, verify all four surfaces are updated: README → code/CLI → GitHub About/Topics. Single update to one surface is incomplete.
