---
id: P-KVF7CKVR
type: project
shape: State
title: Harness Args Parameter Format and Normalization
created_at: 2026-07-21T07:51:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e8c19b0cce6e0b12719941c2b4613bc8075960ba903be805bcd48a938882cb54
related: [args-serialization-guard-for-batch-agent-launches, tarball-artifact-must-carry-both-d-263-and-d-264, agent-definitions-load-at-session-start-not-invokable-in-tha]
---

The workflow harness delivers the `args` parameter as a JSON string rather than as a parsed object. Agents/scripts must normalize this in their parsing layer. The current args normalizer script handles both string and object forms transparently, eliminating the failure mode where scripts assume object form.

**Why:** Initial workflow run failed immediately when args normalizer was not present (harness sent string, script expected object). After fixing the normalizer, agents spawned successfully and the workflow proceeded on pace.

**How to apply:** When writing new agent scripts for this harness, include args parsing that tolerates both string and object forms. Use the established normalizer script when available.
