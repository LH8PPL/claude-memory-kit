---
id: P-PKPUKZRH
type: project
title: 'RELEASE-PLAN.md: Authoritative Task-to-Lane Map'
created_at: 2026-06-15T07:17:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2a872cc02a9b3e65a9a41aac96feb3a9a4511bdc3496fd641bbdab53d21db6ff
related: [task-lane-consistency-audit-workflow, planning-docs-as-standalone-commits-on-main, reliable-tarball-file-validation-with-npm-pack-json]
---

RELEASE-PLAN.md is the single source of truth for assigning tasks to versions and lanes. The tasks.md file may include lane tags for reference, but these are not authoritative. **Binding rule:** every task must be assigned in RELEASE-PLAN.md at the same time it receives a lane tag in tasks.md. Any task with a lane in tasks.md but missing from RELEASE-PLAN.md is a dangling reference and must be fixed in RELEASE-PLAN.md.

**Why:** Prevents silent orphans. A task could appear laned in tasks.md but actually lack a version assignment, causing confusion about scope and release timing.

**How to apply:** After adding laned tasks to tasks.md, immediately add them to RELEASE-PLAN.md. Periodically audit by comparing both files — look for tasks in tasks.md that lack entries in RELEASE-PLAN.md. Run validators (references, numbering-gaps) to catch inconsistencies.
