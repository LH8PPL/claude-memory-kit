---
id: P-A7SQ5QTE
type: project
shape: Timeless
title: Doc Update & Release Boundary Rule
created_at: 2026-07-29T08:20:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 491835a943fa60a3a98e558b5fcf38ea49127b73e377c6648e6073d1a54f2354
---

Documentation updates follow two rules:
  - Per-change: Feature updates to README/CLI/MCP/design docs ship within their feature PR
  - At cut: RELEASE-PLAN and CHANGELOG finalized when version is cut; version mentions (e.g., v0.6.2) kept as historical references

**Why:** Keeps docs synchronized incrementally; avoids batch doc-churn at release time and preserves version history

**How to apply:** During feature PRs, update relevant docs in the same PR; at release cut, finalize RELEASE-PLAN/CHANGELOG only
