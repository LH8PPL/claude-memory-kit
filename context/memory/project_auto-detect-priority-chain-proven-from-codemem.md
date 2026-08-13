---
id: P-NKWEPT72
type: project
shape: Timeless
title: Auto-Detect Priority Chain (Proven from codemem)
created_at: 2026-07-05T16:48:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f79b5d2195a51ef20eb5791e14e63e5955ddebdbfbcfe103a2b1c82bee7663ee
related: [codemem-validates-multi-cli-auto-detect-approach-in-producti, npm-11-x-deprecate-command-with-version-ranges-fails-with-sp, two-tier-backend-architecture-for-headless-llm-invocation]
---

The ordering that works in production:
1. Explicit config (env var or config file, if user has set one)
2. Detect Claude environment (CLAUDE_CODE_ENTRYPOINT or claude on PATH)
3. Detect other CLI (codex, kiro-cli, cursor-agent — in priority order)
4. API-key fallback (when no CLI is available)

**Why:** codemem uses this ordering to handle real-world edge cases (user may have multiple CLIs, auth-state issues, no CLI at all). Proven in the field; saves re-deriving the ordering.

**How to apply:** Implement this chain in makeBackend selector logic. Test each branch independently.
