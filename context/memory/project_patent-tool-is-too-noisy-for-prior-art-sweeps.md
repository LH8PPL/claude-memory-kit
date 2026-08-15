---
id: P-H5HUXKX6
type: project
title: Patent Tool Is Too Noisy for Prior-Art Sweeps
created_at: 2026-06-29T12:46:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 897395a57d41044c07abc8c69142038fc7a944db4092f7adf5836814fda2e79b
related: [research-agents-use-sonnet, cmk-search-scope-limitation-with-decision-queries]
---

Ran prior-art search on `patent` tool; returns ~38 fuzzy matches per query ranked by blurb-similarity. Low signal-to-noise ratio — most results are tangential (coding-agent CLIs that aren't memory systems). Confirmed not worth adopting for focused research.

**Why:** Time spent deep-reading 38 results × multiple queries yields diminishing returns. Better to use tool for breadth only and cherry-pick top results.

**How to apply:** Skip patent tool for future prior-art work. If breadth scan is needed, run once and focus on top 3–5 results only.
