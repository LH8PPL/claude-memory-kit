---
id: P-G54J6XJT
type: project
shape: Event
title: 'v0.4.5: Agent-Relative LLM Backend Feature'
created_at: 2026-07-06T17:23:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b2f9da6e367d85a3cb7428aa122badc7056ea3673cad2bc704658e37e807e0db
related: [v0-4-5-kiro-cli-dispatch-guard-implementation, kit-compatibility-requirement-clarified, hook-recursion-guard-cmk-backend-spawn-environment-variable]
---

v0.4.5 (Tasks 200–202) solved the problem that non-Claude users (Kiro/Cursor only, no `claude` binary) had no LLM backend, causing automatic features (compression, extraction, summarization) to silently no-op.

**Solution:** route all LLM calls through whichever agent CLI is available:
- `make-backend.mjs` — selects backend
- `kiro-backend.mjs` — routes through `kiro-cli chat`
- `cursor-backend.mjs` — routes through `cursor-agent`
- Integrated into `compressor.mjs`, `doctor.mjs`, `subcommands.mjs`

**Side effect:** `kiro-hook-dispatch.mjs` gained a recursion guard (`if (env.CMK_BACKEND_SPAWN) return noop`) because spawning kiro-cli as a backend would re-fire the kit's own hooks. Low-risk (only active during backend calls).

**Verification:** D-281 live-tested on real tarball; cut-gates BK1–BK4 test end-to-end.

**Why:** The kit's automatic features only work if an LLM backend exists. Before v0.4.5, only Claude users had one. This release unblocked Kiro and Cursor users and explains why a recursion guard exists in the hook dispatch path.

**How to apply:** When maintaining auto-features, test across all three backends (claude, kiro-cli, cursor-agent). Don't modify the recursion guard without understanding the backend spawning behavior.
