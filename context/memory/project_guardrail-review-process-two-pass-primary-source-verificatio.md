---
id: P-MJDKT4TT
type: project
title: 'Guardrail Review Process: Two-Pass + Primary-Source Verification'
created_at: 2026-06-22T17:14:11Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: dd599cbbda694a36b948fcccc36f2ccfe7cc9cf256c4cb29c321cc9e32df9930
related: [data-loss-bug-pattern-echo-rm-laundering, d-364-discipline-for-external-source-claims, stress-gate-required-before-pr-for-spawn-hook-boundary-chang]
---

Guardrail changes are validated via a two-pass review that includes primary-source fact-checking against actual code/research, not just proposals. This process catches both logical errors (e.g., wrong Kiro assumptions) and implementation bugs (e.g., data-loss bypasses).

**Why:** The two-pass review with primary-source verification is the project's quality gate for guardrail PRs.

**How to apply:** Future guardrail work should expect this review depth. Prepare source citations and be ready to have assumptions fact-checked against the actual codebase.
