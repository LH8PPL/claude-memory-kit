---
id: P-a66RC3LN
type: project
shape: Absence
title: Kit lacks skill-fire telemetry for measuring recall improvements
created_at: 2026-07-22T13:59:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 90b2818cf0aa2e92255f589adac6eb911f1f69e5fdfb2cfbbb7ad7858c0aa409
related: [kit-identity-a-harness-over-the-harness-the-user-s-framing, task-233-adr-0024-memory-search-fix-via-evidence-bearing-hin]
---

**What's missing:** Kit logs recalls (recall-log) and extraction outcomes (D-122 trend), but does NOT log skill invocations. Cannot measure whether 233's hint upgrade actually improves fire rate — the ADR's own success criterion.

**Compounding issue:** Any measurement must record the harness's tool-loading policy, or numbers aren't comparable (per deferred-tools finding P-DXPCKAUU).

**Why:** "Fired zero times" is anecdote, not telemetry. Can't validate a fix you can't measure.

**How to apply:** Add skill-fire logging alongside 233 implementation. Include harness tool-loading policy in telemetry context. This decouples feedback from intuition and makes before/after measurable.
