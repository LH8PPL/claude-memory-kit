---
id: P-VSaR2F3U
type: project
shape: Absence
title: BOM'd Fact Files Are Invisible to Scanning
created_at: 2026-07-25T10:04:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d556a7f68e911d1bd21726d975ed5109e1e498f99882d804b338445f93f07a5f
related: [skill-review-imported-facts-staleness-bug-fixed, three-tier-memory-architecture, file-pointer-format-and-interpretation]
---

During Task 248, discovered that fact files marked with BOM metadata are invisible to the kit's scanning and extraction systems. This gap was identified but intentionally NOT fixed mid-flight (left for a dedicated BOM task). Root cause unclear; impact is that BOM'd knowledge files don't surface in recovery or validation passes.

**Why:** Architectural blindspot that affects data recovery completeness; tracked separately to avoid scope creep on install-path fixes

**How to apply:** When approaching the BOM task, search context/memory/ and task logs for "BOM" to locate all instances; verify scanning logic in [scanner module—to be identified]
