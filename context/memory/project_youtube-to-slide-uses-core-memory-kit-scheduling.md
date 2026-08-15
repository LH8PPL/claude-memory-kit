---
id: P-NFVBC6PL
type: project
shape: State
title: youtube-to-slide Uses Core-Memory-Kit Scheduling
created_at: 2026-07-19T06:30:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 67097d162f97145ca9271ea47622de377258eb3da7eaa97ac41a5a2284868ed7
related: [youtube-to-slide-scheduled-task-shims-vbs-launchers, register-crons-for-staleness-starvation-prevention, scheduled-tasks-use-absolute-paths-renaming-requires-re-regi]
---

youtube-to-slide has been migrated from hand-built scheduled tasks to core-memory-kit management. Migration included deleting three legacy scheduled tasks (`ytslide-daily-memory-distillation`, `ytslide-weekly-memory-curator`, `ytslide-nightly-memsearch-index`), importing 7 existing sessions and 5 legacy project facts, healing the memory index (HC-4 PASS), and consolidating all memory operations under the kit's unified system.

**Why:** Eliminates duplicate task-scheduling systems (was two separate sets), enables unified health checks via `cmk doctor`, prevents the popup/crash issues caused by overlapping definitions, simplifies ongoing maintenance

**How to apply:** Future sessions assume youtube-to-slide is kit-managed; all scheduled distillation/curation runs through the kit; use `cmk doctor` to verify system health
