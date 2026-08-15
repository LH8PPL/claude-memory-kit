---
id: P-NJHYLX3P
type: project
title: Why LLM-Driven Gates Are Live-Test Flags, Not Assertions
created_at: 2026-07-01T07:34:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 35dd8dc5f86f5feb727e14bbcfb7ae198119056b038ac709e480b8e5d07f3392
related: [decisions-md-cut-gate-structure-dj1-dj4, guides-are-runbooks-not-journals]
---

`cmk persona generate` runs the real end-to-end promotion decision (classifier, recurrence gate, decide) from the CLI.

Haiku (live LLM) sits in the classification step, which is non-deterministic — same input can classify slightly differently run to run.

Surrounding mechanics (recurrence sum, gate arithmetic, audit provenance) ARE deterministic; only LLM classification isn't.

Result: Can't script a pass/fail assertion like "assert promotes via recurrence-3". Instead, run live and eyeball the audit line to confirm reasoning.

**Why:** Live LLM decisions are inherently non-deterministic. The project deliberately accepts this tradeoff for the benefit of real LLM-driven classification in the promotion gate.

**How to apply:** Treat LLM-driven gates (Task 151 et al) as "live-test flags" — run them, read audit output, confirm reasoning — rather than automated scripted assertions. Deterministic mechanics can be tested rigorously; the LLM classification step in the middle cannot.
