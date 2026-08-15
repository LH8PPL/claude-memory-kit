---
id: P-M7AUP769
type: project
shape: Timeless
title: Laundering Detection — Official Spec vs. Community Reimplementation
created_at: 2026-07-21T11:52:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dc8d91ca2ad220df0af6f062ac932cdf32084ae48e11ffe9d65324709e226e6a
related: [100-sessions-200-line-index-four-named-zsardqaa, llm-memory-spec-attribution-verification, research-verification-workflow-parallel-agents-batch-integra]
---

Detect when community reimplementations (e.g., GitHub `dream-skill`, whose README states "replicates unreleased feature") are presented as official Anthropic/OpenAI specs.

**Example:** "100 sessions / 200-line index / four named phases" originates from dream-skill, not Anthropic official docs (which omit these details).

**Implication:** Only official documented sources count as design requirements; unofficial reimplementations are guesses, not binding prior art.

**Why:** Prevents building design decisions on false assumptions sourced from hobbyist guesses instead of actual official contracts.

**How to apply:** When cross-referencing design elements, always verify in official primary docs first; flag any claim absent from official sources as "unofficial guess, not binding spec".
