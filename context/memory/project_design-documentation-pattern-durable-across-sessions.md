---
id: P-59WP2aNJ
type: project
shape: Timeless
title: Design Documentation Pattern — Durable Across Sessions
created_at: 2026-07-22T14:06:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0aa59f41a17aff0475f1a634882d750fd595d8a6f8dd8f79c51487e27c33b7c7
related: [grill-style-design-decision-process, task-255-viewer-design-grill, pre-commit-hook-sanitizes-fact-files-for-security]
---

Reframes and rejected design shapes are stored in tasks.md and the fact store for durability. A fresh session picks up the corrected frame rather than rediscovering draft rejections.

**Why:** Prevents rework and preserves reasoning behind shape decisions

**How to apply:** When working on a new lane or PR, check tasks.md and the fact store for prior explorations and rejected alternatives before proposing a new direction
