---
id: P-X5aKHFTY
type: project
title: '2026-07-01 Arc: Complete Output Inventory and At-Risk Layer'
created_at: 2026-07-01T21:13:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6f1e9b3e9cf1e6fcd1367a646de9d036e13d3932444e2928465e1beffee06a1a
related: [raw-research-evidence-preservation-vs-synthesis-only-boundar, kit-dogfooding-the-arc-that-redefined-memory-capture-was-its, decision-trail-and-knowledge-preservation-system]
---

**Headline artifacts (Layer 1):** 5 docs — SYSTEM-MAP.md, ADR-0017, U-Mem research note, failure-survey, comparative-judgment note

**Spine updates (Layer 2):** 11 modified files including Tasks 188+189 (new), enrichments to Tasks 55/66/95, D-251 decision-log entry, SOURCES.md, DOCUMENTATION-MAP, context/queues/review.md

**Kit self-capture (Layer 3):** 75 auto-extracted facts from the session that redefined the kit (the dogfood layer)

**At-risk raw evidence:** 4 large temp files (~420 KB total) — comparative-judgment study 152KB, full-field survey 134KB, wave-2 deep-reads 69KB, original 9-system 68KB. Each contains verbatim code quotes, exact file:line references, per-system analyses. Re-generation cost ~4M tokens.

**Why:** The arc produced a thesis (recurrence as the fuel variable) and created multiple output layers. A future session asking "what exists from this arc" needs the complete picture, including what's at-risk. The design principle (evidence-linked claims, decision-trail preservation) makes raw-evidence preservation a design choice, not an afterthought.

**How to apply:** Before disposition decisions (e.g., let raw evidence expire, or commit it), consult this inventory. If committing raw files, register as `docs/research/raw/{date}-{artifact}/` frozen archives with citations in synthesis notes. If discarding, document as a design boundary (synthesis-only).
