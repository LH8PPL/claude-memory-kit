---
id: P-T5TCV92E
aliases: [P-T5TCV92E]
type: project
shape: Timeless
title: Feature Branch → Reviewer → Merge Hold Workflow
created_at: 2026-08-08T15:16:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 44625b529fb2fd893acfe08ab22e336896a2b2f42a843cc46c9345af1938cf38
related: [release-handoff-pr-creation-vs-merge, post-fix-integration-workflow, v0-5-1-release-pr-282-must-merge-before-tag]
---

Feature branches (e.g., `task-262-write-time-linking`) flow: commit → reviewer holistic pass → fix findings → push → PR open → hold for user merge approval. Merges do not auto-happen after reviewer passes.

**Why:** User retains final say on all merged code; prevents unintended auto-merges.

**How to apply:** Follow the sequence. When reviewer reports pass, await user signal before merging PR.
