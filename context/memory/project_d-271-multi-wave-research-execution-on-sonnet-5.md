---
id: P-YSF64NYA
type: project
shape: Plan
title: D-271 Multi-Wave Research Execution on Sonnet 5
created_at: 2026-07-05T13:59:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ae36dfbc12797540f484d683bb3f6b0424ecbabe6d5f721615a044dac7f44afe
related: [wave-based-agent-research-for-cursor-windows-invocation, d-271-deep-research-headless-llm-invocation-patterns]
---

- Target research: How ~70 projects invoke LLMs headlessly (CLI, API, agent mode, per-agent CLI) across Windows/Mac/Linux
- Agent model: Sonnet 5 (not Opus 4.8) to optimize subscription costs
- Wave structure: Discovery (Wave 0) + synthesis phases, with approval gates between
- At each wave boundary: manifest + token burn report before proceeding
- User maintains explicit kill switch; no auto-advancement

**Why:** User has subscription cost constraints; batching with transparency allows controlled, budget-aware progression

**How to apply:** Launch Wave 0 on Sonnet 5. After discovery phase, report manifest + token burn. Wait for user approval before Wave 1.
