---
id: P-SZBGN6KF
type: project
shape: Event
title: Task 141b (node:sqlite Migration) Rejected in D-162
created_at: 2026-07-21T06:50:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 08c34a4fec02d7cec4235703578140da94044d448888087a9ca9a19c3a544336
related: [node-sqlite-migration-decision, 141b-is-rejected-decision-rationale, semantic-search-vs-grep-trade-off-d-111-design-rationale]
---

- Decision date: June 2026 (documented in D-162)
- Reason for rejection: Comprehensive testing showed performance regression — FTS5 keyword search ~10% slower; incremental reindex ~32% slower vs. current better-sqlite3 approach
- Status: Closed; not a candidate for reconsideration on performance grounds alone

**Why:** This decision was based on measured performance data and represents a deliberate choice to maintain SQLite with better-sqlite3 for FTS search performance

**How to apply:** If future architecture discussions touch on alternative SQLite drivers or node:sqlite, reference D-162 and the performance tradeoffs documented there
