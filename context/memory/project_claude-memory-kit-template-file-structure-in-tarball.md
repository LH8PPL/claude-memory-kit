---
id: P-69AFCHKZ
type: project
title: Claude Memory Kit — Template File Structure in Tarball
created_at: 2026-06-11T11:32:50Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3b7a652b1f4b0cc88aa35391d53feb5718aac602
related: [three-tier-memory-architecture, claude-memory-kit-cmk-doctor-baseline-pre-first-turn, claude-memory-kit-health-check-suite-hc-1-through-hc-9]
---

The npm pack for `@lh8ppl/claude-memory-kit@0.3.0` produces a 268.5 kB tarball (839.3 kB unpacked) containing exactly 22 template files:
- `.claude/skills/memory-search/` — memory-search skill definition
- `docs/journey/` — journey-log template
- `local/` — machine-paths and overrides templates  
- `project/` — core memory system (MEMORY.md, sessions, SOUL.md, transcripts, queues, archive dirs with .gitkeep)
- `support/cron-jobs/` — daily-distill and weekly-curator job definitions
- `user/fragments/` — shared profile fragments INDEX
- `user/` — HABITS.md, LESSONS.md, USER.md templates
These are mirrored by `prepublish-copy-template.mjs` during npm pack.

**Why:** The template structure defines what gets installed into fresh projects. Knowing exact file count and layout helps verify pack completeness and predict post-install directory structure.

**How to apply:** When validating a new npm pack, confirm the tarball lists exactly 22 template files and all expected directories. When onboarding, verify all template dirs appear after `cmk install`.
