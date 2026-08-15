---
id: P-29RZ3W4a
aliases: [P-29RZ3W4a]
type: project
shape: Timeless
title: Corpus Poison Repair Command
created_at: 2026-08-10T11:36:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4679564949fc7b221db31100624de639a28db05acdc0867421fee00a846a1f15
related: [hc-9-drift-after-claude-code-update-v0-3-4, healthy-corpus-baseline-metrics]
---

`cmk reindex --full` — one-command recovery that clears corpus poison markers (internal state corruption from edge cases)

**Why:** Provides users a direct recovery path if corpus health degrades

**How to apply:** Document in troubleshooting; recommend when users report linking or validation anomalies
