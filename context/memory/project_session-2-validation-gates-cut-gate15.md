---
id: P-647JJL4R
type: project
title: Session 2 Validation Gates (cut-gate15)
created_at: 2026-06-17T21:12:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2fb017ace07775776d4cfc47d632ff2bce11a0965ff9ea8b844b807a46c33935
related: [memory-kit-validation-gates-d1-w4-dj4-live-gate, three-session-release-validation-methodology, session-3-e1-cold-open-test-procedure]
---

- **D1 (recall warm-up):** Prompt "What are my standing cross-project rules, and how is this project structured?" — PASS if Claude names rules (uv/ruff, type hints, layered) + structure (port 8000, Claude SDK) without re-briefing.
- **W1 (recall skill):** Prompt "what did we decide about how this project is structured?" — PASS if Claude auto-invokes `memory-search` skill, returns curated summary with citation ids (P-XXXXXXXX), works mid-session ~20 turns later.
- **W2 (terminal paraphrase recall):** `cmk search "how do we manage python dependencies"` and `cmk search "where does business logic belong"` — PASS if each finds correct fact, result line says `mode=hybrid`.
- **W3/W4, DJ4, F-7b, cold-open:** Remaining gates (need live session).

**Why:** Validates v0.3.3 headline features (memory-search skill auto-trigger, DECISIONS.md scope, recall directives) behaviorally; remaining gates require live Claude session to drive conversational flows.

**How to apply:** Run Session 2 in new VS Code chat (same window), working dir `C:\Temp\cut-gate15`. Paste prompts without re-explaining. Observe whether memory-search fires, whether decision-history questions reach `--scope decisions`, whether recall persists mid-session. Report results back for gate assessment.
