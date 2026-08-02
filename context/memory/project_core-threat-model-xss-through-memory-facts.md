---
id: P-TYKaD6ZV
type: project
shape: Timeless
title: 'Core Threat Model: XSS Through Memory Facts'
created_at: 2026-08-02T12:56:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7a6315b2dfcb85fc9ac510d7d6daf5e9722b468fc3ff8d9b01629b46e9f3439a
---

Viewer renders LLM-generated fact bodies; poisoned memory (malicious script in a fact body) that executes in the viewer is this kit's exact threat model. Tested vectors: XSS execution, write bypasses, path traversal, rebinding attacks.

**Why:** The kit's distinguishing risk is that facts are LLM-authored; adversarial testing seeds attack HTML into rendered facts to verify escaping.

**How to apply:** When adding features that render user/LLM content, test for HTML injection with seeded payloads; ensure output escaping; ban HTML-parsing sinks from page forever (not just doc it).
