---
id: P-4EGENKKN
type: project
title: Task Queue Organization & Naming Convention
created_at: 2026-06-13T09:56:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d88d9c36aac3b4579259e9fe33a22cd06fc90792
related: [doc-update-release-boundary-rule, minor-boundary-backlog-sweep-d-248-convention, backlog-for-v0-3-x-and-v0-4]
---

Project work is tracked by task codes:
  - **D-xxx** (e.g., D-143, D-126) → housekeeping/structural tasks
  - **Numbered** (e.g., 129/130, .gitattributes) → feature/CLI items
  - **CLI items** require README/CHANGELOG updates as part of completion criteria
  - Progress is tracked toward **within-paradigm queue** completion (v0.3.x release readiness)

**Why:** Task codes are used as shorthand in planning and PR context; CLI items have documentation prerequisites; queue structure clarifies what "done" means for a release

**How to apply:** Reference task codes when discussing work; plan documentation updates as part of CLI-item scope; use within-paradigm queue completion as a readiness checkpoint for v0.3.x
