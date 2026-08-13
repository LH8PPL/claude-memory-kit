---
id: P-MWSWK34R
type: project
shape: Timeless
title: Args serialization guard for batch agent launches
created_at: 2026-07-05T14:12:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dba081c365e06a48aac26a84eba0c0016039100a019ff308892de4041180763b
related: [harness-args-parameter-format-and-normalization]
---

When spawning agent pools via batch invocation, args may arrive as either JSON string or parsed object. Guard with `typeof args === 'string' ? JSON.parse(args) : args` to normalize before processing. Use `parallel(map(=> () => agent(...)))` pattern for parallel spawning (documented pattern).

**Why:** Previous launch failed silently at script-eval due to inconsistent input format. Guard prevents eval errors and ensures agents spawn correctly.

**How to apply:** Apply guard in agent launcher whenever args come from external/serialized invocation context.
