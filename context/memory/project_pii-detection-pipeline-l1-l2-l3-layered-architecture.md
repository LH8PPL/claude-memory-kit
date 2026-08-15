---
id: P-aGZP7NMC
type: project
shape: Plan
title: PII Detection Pipeline — L1/L2/L3 Layered Architecture
created_at: 2026-07-07T19:49:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 67e53fb7db9e473f02b606c1c1b24c202babb510bfd4ebb055f9c5d3994d53d1
related: [pii-detection-landscape-regex-vs-llm-trade-offs]
---

- **L1 (hot path)**: Presidio-style pattern catalog (JavaScript, extends Poison_Guard), ~2ms
- **L2 (optional)**: Local NER model; likely to skip
- **L3 (detached)**: Haiku LLM judge for context-dependent PII, ~180-400ms

**Why:** Balances performance, precision (patterns first), and recall (LLM fallback).

**How to apply:** Framework for implementation once all agent research complete; finalize L2 decision pending field-diff report.
