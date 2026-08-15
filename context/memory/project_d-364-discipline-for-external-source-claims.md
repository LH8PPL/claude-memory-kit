---
id: P-MCWGF2LE
type: project
shape: Timeless
title: D-364 Discipline for External Source Claims
created_at: 2026-07-22T16:54:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a8ea2061a26926bd5bd1f525b92ff59cadbe441ad03aea9c901a0ea76965879d
related: [d-364-discipline-code-verified-vs-readme-only-research-taggi, guardrail-review-process-two-pass-primary-source-verificatio, primary-source-verification-protocol]
---

When evaluating external sources or prior art (e.g., Octopoda), tag all claims as either:
  - **code-verified** (with file paths) — claim checked against actual implementation
  - **README-only** — claim from documentation only
Rationale: External projects have a history of shipping less than their READMEs promise; verification is essential to avoid building on unreliable claims.

**Why:** Maintains research quality and prevents adopting unproven external ideas as-is

**How to apply:** Apply this discipline when reviewing Octopoda findings and any future external source evaluations
