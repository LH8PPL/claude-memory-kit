---
id: P-DE43PUK2
type: project
shape: Absence
title: Agent-neutral names persist across any rename
created_at: 2026-07-14T12:47:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8dfa512d5cdee298361d62613cf36ae4bbf4e2c1daef6dfb74bc16de94669353
related: [text-substitution-carve-outs-for-rename, gitignore-carve-out-for-claude-agents, cursor-supports-headless-agent-cli-cursor-agent-p]
---

The CLI binary `cmk` and environment variable `MEMORY_KIT_USER_DIR` are intentionally agent-neutral (per ADR-0012 §75) and must NOT change in any rename, even to `core-memory-kit`.

**Why:** These are shared infrastructure for multiple agents (Claude, Cursor, Codex). Changing them breaks cross-agent portability.

**How to apply:** In any find-replace for a rename, explicitly carve out `cmk` and `MEMORY_KIT_USER_DIR`. They stay as-is.
