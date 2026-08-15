---
id: P-YXFREZ9E
type: project
shape: State
title: False-Positive PII Redaction Recovery Log
created_at: 2026-07-07T20:23:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 338ecf8cf637da37040554f9ab28f5d7da860d775093fb406e9a2e3d05f131e0
related: [kit-delete-guardrail-false-positive-on-commit-messages, non-destructive-flagging-with-blocked-placeholders]
---

Gitignored `redactions.log` (NDJSON: original→placeholder) allows wrongly-redacted spans to be recovered locally. Never committed.

**Why:** Over-aggressive masks hide legitimate data. Local recovery prevents permanent loss on false positives.

**How to apply:** If redaction is wrong, check log locally for original text. Document pattern mismatch for next L1 refinement.
