---
id: P-3G5KE7NV
type: project
shape: State
title: 'PII Detection Landscape: Regex vs LLM Trade-offs'
created_at: 2026-07-07T19:49:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5703405101334a7a3127062388d3d5288c55dff540497c3cb9ef7a4528a50770
related: [pii-detection-pipeline-l1-l2-l3-layered-architecture, task-148-auto-judged-privacy-layered-screen-architecture]
---

- **Regex patterns** (~2ms, Presidio-style): Pattern-only, high precision for emails/phones/paths/keys; cannot handle context-dependent PII (names, health).
- **Local NER models**: Domain-brittle; performance degrades on different text types.
- **LLM judgment** (Haiku, ~180-400ms): Only high-recall option for names/health in conversation; suitable for detached process.
- **Anthropic PII purifier prompt**: Official expert resource; handles obfuscation patterns; returns full redacted text.

**Why:** Informs the three-layer PII detection architecture for the pipeline.

**How to apply:** Use as foundation for L1/L2/L3 implementation; prioritize Anthropic's prompt for LLM redaction layer (L3).
