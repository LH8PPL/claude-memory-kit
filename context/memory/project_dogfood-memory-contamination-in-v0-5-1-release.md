---
id: P-JAKHD5X6
type: project
shape: Event
title: Dogfood Memory Contamination in v0.5.1 Release
created_at: 2026-07-12T18:09:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f0d2e6fbaf9b1975f89d8c871b6f883eaf65f04cf5b256791fef2bf779964ccd
related: [cmk-forget-as-safe-fact-removal-method, task-boundary-memory-flush-rule]
---

Six auto-extracted facts describing a Python FastAPI backend (gate-practice-app) contaminated Node CLI repo memory when cut-gate ran during dogfood session. All 20 facts were reviewed in full (not grep shortcuts). Six bleed facts tombstoned via `cmk forget`, 14 legit facts committed. Pre-commit screen verified no secrets/paths.

**Why:** Recurring dogfood contamination risk; cleanup process and cmk forget safety should be documented for future sessions

**How to apply:** When contaminated facts found, read all content fully, identify source, use cmk forget for safe removal (facts recoverable via archive/tombstones/), commit clean facts separately
