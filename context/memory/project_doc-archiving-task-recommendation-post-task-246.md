---
id: P-YUWKJ6AX
type: project
shape: Plan
title: Doc Archiving Task Recommendation (Post-Task-246)
created_at: 2026-07-22T08:52:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5a5ff1d7faba19c61fe65f44712a52418986ceab61c1fe6b35c32b4b37dc54ae
related: [three-file-archive-structure, full-repo-audit-complete-131-tasks-0-fabricated-ships, three-archive-splits-at-v0-5-release-boundary]
---

Recommended scope for formal archiving task:
- Archive completed task entries from tasks.md → tasks-archive.md (halves live doc, cleans navigation)
- Archive pre-v0.5 entries from DECISION-LOG.md and build-log.md into dated archive files (both are >1 MB append-only histories)
- **OUT OF SCOPE**: design.md (D-228 Spine), INDEX.md (Task 95 curation)

All moves are pure relocation with zero information loss. Project already has `archive/` folder and "frozen RECORDS" category.

**Why:** Live docs have swollen with shipped/historical material. Archiving improves readability and reduces git-diff noise.

**How to apply:** File as formal task after Task 246 lands. Include source-of-truth table and doc-drift walk in task scope.
