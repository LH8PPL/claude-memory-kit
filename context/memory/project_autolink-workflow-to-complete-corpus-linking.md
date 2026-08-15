---
id: P-NMKVWBX9
aliases: [P-NMKVWBX9]
type: project
shape: Timeless
title: Autolink Workflow to Complete Corpus Linking
created_at: 2026-08-10T10:45:46Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c48850a0f6ce910eec34865d8c780a9ba590215cc4bfdbe6488b68169333f28d
related: [corpus-autolink-workflow-after-pr-259, memory-persistence-validation-workflow-end-to-end, ci-watch-pattern-must-await-all-checks-not-subset]
---

The `cmk autolink --apply` process is bounded per run (ADR-0020). To complete linking the entire corpus:
1. Loop `cmk autolink --apply` until the output contains no "remain" line (approx. 8 more runs for ~1,895 remaining facts)
2. Run `cmk reindex --boot` to rebuild the graph structure
3. Manually refresh the Graph tab — auto-refresh is not enabled

The graph representation changes significantly after reindexing: from ~4% linked to ~85% linked.

**Why:** The bounded process requires iteration; the graph doesn't auto-update; understanding the full workflow prevents false expectations about single-run completion.

**How to apply:** When linking a large corpus, use the loop-reindex-refresh pattern. Don't expect a single invocation to complete the job.
