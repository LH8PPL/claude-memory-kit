---
id: P-CX4MXQ4P
type: project
shape: Timeless
title: 'Field Survey: Zero Multi-CLI Routing (32 projects)'
created_at: 2026-07-05T15:42:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d0014e122c9356f116ec0150bc24b74000c1390c4450ee4b2617daf786943caa
related: [codemem-validates-multi-cli-auto-detect-approach-in-producti, two-tier-backend-architecture-for-headless-llm-invocation, multi-agent-llm-invocation-research-initiative]
---

**Finding**: Zero of 32 surveyed projects implement multi-CLI routing (automatic routing to whichever agent CLI is installed).

**Field's four patterns**:
- No headless LLM call (~19) — deterministic search; cross-agent via MCP
- Single specific CLI (~6) — locked to one agent (typically `claude -p`)
- Cloud API key (~4) — bypasses agent, calls direct API
- Agent SDK (~4) — one agent SDK headlessly

**Also confirmed**: Amazon Q/Kiro is single-CLI; shells out to `q` in delegate.rs.

**Why:** Validates that automatic + portable (work with any agent CLI) is a genuine market gap the field hasn't solved. The field chose one property; this project insists on both.

**How to apply:** When designing the multi-CLI feature, remember there's no established convention—prioritize correctness and clarity.
