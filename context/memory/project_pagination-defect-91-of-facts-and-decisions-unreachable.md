---
id: P-E3QSZH4S
aliases: [P-E3QSZH4S]
type: project
shape: State
title: Pagination Defect—91% of Facts and Decisions Unreachable
created_at: 2026-08-05T21:27:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5718d1771bcdd1491eab3eec5dce93c6664d7fe82e1a91b1ea7b5daeae7d54d3
---

- Memory view: 200 items shown, ~2,300 exist (91% unreachable)
- Decisions view: 200 items shown, 2,502 exist (92% unreachable)
- Health view: 15 items shown, 15 exist (complete, pagination unnecessary)
- No offset/cursor/page URL parameters exist anywhere in the viewer
- API `/api/decisions` returns `truncated: true, total: 2502` but viewer has no way to request more results
- Test suite missed this because tests only assert on responses that fit under the cap (looks complete from inside the suite)

**Why:** Core UX defect breaks knowledge discoverability; discovered via user exploration rather than automated testing

**How to apply:** Task 269 (v0.6.6) implements search-first access with paging as fallback. Review test strategy to ensure coverage includes full dataset or mocks truncation.
