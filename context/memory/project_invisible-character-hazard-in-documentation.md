---
id: P-BUABTDRA
type: project
shape: Timeless
title: Invisible Character Hazard in Documentation
created_at: 2026-07-27T08:19:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a9bbd048a1cd34b36dae4df6bc7245757c133fa3e212e6134424f1089958eb75
related: [stress-test-phase-in-pre-merge-workflow, validation-pipeline-for-claude-memory-kit-includes-format-an, multi-layer-gating-before-main-merge]
---

Text editors silently eat invisible characters (zero-width spaces, line separators, etc.). Discovered via byte-scanning. Include byte-scanning as standard review discipline.

**Why:** Invisible characters cause subtle issues and are invisible to visual review. Byte-scanning catches them reliably.

**How to apply:** Make byte-scanning of documentation outputs a standard part of review QA. Catch this before merge.
