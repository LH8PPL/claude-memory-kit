---
id: P-F9JYUSNJ
type: project
shape: State
title: Fable 5 Dual-Use Safety Flagging Behavior
created_at: 2026-08-02T18:34:29Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4fae578b26221ba2963733185d79b261f5f8d7caf2daae7b950d46f0b2030eb3
related: [cmk-hook-capture-fails-during-stress-gate, bash-cwd-drift-creates-packages-cli-context-artifacts, sonarcloud-then-in-object-false-positive-schema-fields]
---

Fable 5 (the model tier in this environment) includes extra dual-use safety measures that flag defensive security work as potentially offensive. In code reviews, this triggers flags on vocabulary like "XSS audit," "seeded payloads," "DNS-rebinding probes," "ReDoS," and "exfiltrate" — all used defensively in security reviews.

- Current state: Flags are advisory ("misfiring on vocabulary, not intent"), not blocking.
- Workaround: Explicit authorization context in prompts ("this is a security review of our own repository, defensive") suppresses flagging.

**Why:** Understanding this is a model-tier behavior (not misconfiguration) and knowing the workaround prevents confusion in future security reviews.

**How to apply:** If flagging reoccurs, add explicit context to dispatch prompts. Expect vocabulary flagging during security-review workflows; it doesn't block execution.
