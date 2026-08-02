---
id: P-6BAYY2CC
type: project
shape: State
title: Recursive Improvement Pattern via Verification Questions
created_at: 2026-07-29T08:20:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 97f186677421c6e1fb2903247e458e93e495a61e896455c656473278444ffa62
---

Repeated verification questions ("did we update docs?") drive system improvements that eliminate the need for the question. Each instance has triggered a validator or rule (doc-validator system, citation checks, verb consistency, health check tracking). Pattern is now self-eliminating as automation matures.

**Why:** Shows project maturity; signals when a manual verification pattern should become an automated gate

**How to apply:** Treat recurring verification questions as prompts to build validators/checks rather than as one-time answers
