---
id: P-7M3YGMYR
type: project
shape: State
title: Health-Log System Architecture (Ratified)
created_at: 2026-08-01T12:59:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 17bf105418e57d0442fd7da01e05d4b43253bc43e834def2880fb56639c74593
---

- **Split rule:** Auto-fix only kit-owned + reversible + idempotent (piggybacked on existing ops, self-verified); else whispers; unknown defaults to whisper
- **Actionability:** Deterministic 1-strike; stochastic 2-consecutive; 7-day freshness window
- **Cadence:** Stateless whisper on every prompt (max one line); upstream failures suppress downstream
- **Evidence:** Append-only `health.log` (NDJSON: `{class, outcome, ts, detail}`); tail-read bounded chunk for streaks; event-driven only
- **Skill:** Code repair book (symptom → diagnosis → fix → class); confirm-first for user code (ADR-0018); kit codes only; doctor fallback
- **Channels:** Whisper = model-only; `systemMessage` at `memory-off` severity only
- **Wave 1:** Capture chain, inject + lazy-compress, precompact worker, reindex drift, MCP tool errors
- **Registry:** Warnable-shaped (code, title, severity, dependsOn, primaryAction, class) as extension point

**Why:** User ratified this design; it defines health monitoring and failure handling for entire kit implementation. Task 258 (stale-refs advisory) deferred to later, using registry as entry point.

**How to apply:** Reference for health-system implementation, cascade failure design, contributor onboarding. Registry shape enables adding new failure classes.
