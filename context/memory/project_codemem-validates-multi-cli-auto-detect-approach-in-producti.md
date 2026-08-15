---
id: P-Q6Q5VX7Q
type: project
shape: Timeless
title: codemem Validates Multi-CLI Auto-Detect Approach in Production
created_at: 2026-07-05T16:48:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1737dfc931d855b478b756a82c518f82a31843f368db4aa75b0ea7cfaac123d3
related: [auto-detect-priority-chain-proven-from-codemem, field-survey-zero-multi-cli-routing-32-projects, cloud-api-key-is-industry-standard-multi-cli-is-deliberate-d]
---

codemem (by kunickiaj) is a shipping project that implements the exact pattern Task 200 requires — auto-detects the environment (CLAUDE_CODE_ENTRYPOINT, codex on PATH, ~/.codex/auth.json) and shells whichever agent CLI the user has authenticated (claude -p OR codex exec), with API-key fallback when no CLI is present. Native Windows support confirmed. This proves the multi-CLI auto-detect pattern works in production and eliminates the "nobody does this" risk.

**Why:** Codemem is the sole prior-art reference using subscription-reuse multi-CLI routing (vs. the industry standard of cloud-API-key). Validates the design direction and provides a concrete blueprint for selector logic and fallback ordering.

**How to apply:** Study codemem's environment detection and CLI invocation logic as the reference implementation. Adapt its patterns to support Claude + Kiro + Cursor-Agent (broader coverage than codemem's Claude + Codex).
