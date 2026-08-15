---
id: P-LVTJKE2B
type: project
title: Layered Backend Architecture in Live Persona
created_at: 2026-06-14T19:56:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5613976d65ffec1b1938adf27781d46246dbb4079688421f12efe5f5df4c0ead
related: [persona-auto-drain-queue-for-medium-confidence-candidates, e1-cold-open-test-persona-carries-unprompted, e1-cold-open-test-persona-wedge-successful]
---

User's preferred architecture pattern (`app/{api,services,repositories,schemas}`) is now in live persona tier (LESSONS.md + USER.md).

**Promoted**: Via auto-drain from stranded medium-confidence queue.

**Expected behavior**: New Python backend projects auto-scaffold with this layered structure.

**Why:** Architecture was described across projects (inferred vs declared) and stuck in medium-confidence queue; auto-drain moved it to live tier for consistent injection.

**How to apply:** When scaffolding new backends, expect layered structure to appear automatically without re-specification.
