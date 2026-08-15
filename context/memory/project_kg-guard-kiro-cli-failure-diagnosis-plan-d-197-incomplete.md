---
id: P-LTKSACUC
type: project
title: KG-guard kiro-cli failure — diagnosis plan (D-197 incomplete)
created_at: 2026-06-23T20:39:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: adf303f16754180af466b2f8f656b139dbf93fdd96b1f63ccca92ec41c87a4e8
related: [kg-guard-still-fails-with-star-matcher-hook-not-firing-or-en, d198-proven-agentspawn-fires-but-pretooluse-not-on-2-9-0-exe, d-198-fix-agentspawn-hook-now-fires]
---

Matcher fix (D-197) did not resolve the bug. Guard bin works in isolation but kiro-cli still deletes. Two hypotheses:
- **H1:** Matcher format — kiro-cli 2.8.1 requires literal hook name (e.g., `'execute_bash'`), not wildcard `'*'`.
- **H2 (most likely):** Payload mechanism — kiro-cli 2.8.1 passes hook payloads via `_HOOK_EVENT` env var, not stdin. Guard bin reads empty stdin → fail-open.

Diagnostic: instrument the gate's preToolUse hook to log stdin + environment, run a delete in kiro-cli, analyze output.

**Why:** Root cause unknown; hypothesis-driven diagnosis settles the issue in one test cycle vs. continued guessing.

**How to apply:** After user approval, wire diagnostic probe as preToolUse hook, user runs one delete in kiro-cli, output determines fix path.
