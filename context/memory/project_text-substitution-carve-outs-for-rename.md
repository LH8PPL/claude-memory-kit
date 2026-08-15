---
id: P-3644R2D4
type: project
shape: State
title: Text-substitution carve-outs for rename
created_at: 2026-07-14T12:47:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dd42f4bff07bebb747e521fea3a1890738c216dcb02ae77fe4500e5db7dc172f
related: [agent-neutral-names-persist-across-any-rename, config-directory-migration-is-critical-blocker-for-rename, project-governance-adrs-frozen-records-and-two-phase-rename]
---

Three families must be manually reviewed before any bulk find-replace in tier 3:

  1. **Config directory** (`~/.claude-memory-kit/` in tier-paths.mjs:112) — needs migration logic, not text swap.

  2. **Frozen historical records** (`docs/adr/`, `docs/journey/`, `docs/conversation-log/`, `archive/`) — describe the project at the time they were written; do not edit.

  3. **Agent-neutral names** (`cmk` binary, `MEMORY_KIT_USER_DIR` env var) — leave unchanged.

**Why:** Blind find-replace orphans user data, erases historical context, and breaks portability.

**How to apply:** Carve out these paths before bulk substitution. Grep to verify no replacements occur in these families.
