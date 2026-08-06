---
id: P-JZN7Y5DL
aliases: [P-JZN7Y5DL]
type: project
shape: Relationship
title: Fact List vs. Graph Endpoint Population Differences
created_at: 2026-08-06T05:38:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a4797f3a86edb7fd4d04feb9f7a3fdf87c9e135cdabacbd6ecb3c3e6b81431e8
---

Two endpoints serve fact data with different filtering and semantics. The graph endpoint counts facts without the expiry filter, returning all facts regardless of staleness; this computation is expensive (full graph render). The fact list endpoint applies the expiry filter and returns filtered facts. In search mode, the displayed count is capped at the page limit (e.g., shows "50 matches" even for a 500-hit query because only 50 are displayed). The facts endpoint now returns a `total` field representing the actual filtered population in both normal and search modes, separate from the displayed page count. Using the graph endpoint's count for hero numbers on a facts page is both misleading (different population) and expensive (triggers a full graph computation on every page load).

**Why:** Prevents incorrect hero numbers and avoids expensive computations for display purposes.

**How to apply:** Always use the facts endpoint's `total` field for display hero numbers and summaries on the facts page, not the graph endpoint. The graph endpoint is for graph rendering only. In search mode, distinguish between the page-limit cap (displayed count) and the true total.
