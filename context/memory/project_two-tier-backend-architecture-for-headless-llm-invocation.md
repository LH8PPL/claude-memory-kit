---
id: P-E6MKGTDS
type: project
shape: Timeless
title: Two-Tier Backend Architecture for Headless LLM Invocation
created_at: 2026-07-05T14:31:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 24de0eeed00521fb45f9a99ccf089fac887db3e0de284737143c4ecea7262101
related: [kit-s-haiku-backend-has-undeclared-claude-cli-dependency, multi-agent-llm-invocation-research-initiative, field-survey-zero-multi-cli-routing-32-projects]
---

Field-wide pattern (15 projects studied): prefer per-agent CLI when installed (e.g., Kiro, Cursor), fall back to cloud-API-key direct call (e.g., Gemini free-tier, OpenRouter) when CLI absent. claude-mem is the load-bearing precedent: `CLAUDE_MEM_PROVIDER` switch (default "claude" → installed `claude` CLI, else "gemini"/"openrouter" → direct cloud-API calls). **No project in the field reverse-engineers a headless mode for a third-party agent.**

**Why:** Validates kit's two-tier architecture decision; confirms this is the canonical pattern others follow, not an edge case

**How to apply:** Implement cloud-API-key backend as explicit tier-2 fallback (when no agent CLI detected); document as "use this only when no agent is installed", not as primary path
