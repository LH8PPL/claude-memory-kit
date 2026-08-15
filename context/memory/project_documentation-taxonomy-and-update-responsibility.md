---
id: P-3CDHRHBM
type: project
shape: Timeless
title: Documentation Taxonomy and Update Responsibility
created_at: 2026-07-12T12:23:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fb5dd82c378f9228bb0de9b4f9efb9fdd9b7119eba65c330a3b83c154340bc15
related: [multi-surface-documentation-architecture, doc-update-release-boundary-rule, documentation-drifts-at-event-boundaries-not-pr-moments]
---

- **User-Visible Docs** (update when UX changes): CHANGELOG.md (fixed entries), QUICKSTART.md, CLI.md, MCP.md
- **Process Docs** (update with task/gate/release milestones): cut-gate.md (gate steps), RELEASE-PLAN.md (task tracking), build-log.md (retrospectives), tasks.md (checklist)
- **Architecture/Design Docs** (update only for architecture/threat-model/capability changes): design.md, README, ARCHITECTURE, HEALTH-CHECKS, SECURITY, DECISION-LOG
- All doc updates validated by 21 automated validators + name-guard before release

**Why:** Guides scope for doc updates; prevents stale/orphaned docs and keeps releases coherent

**How to apply:** Categorize the task change (UX/process/architecture), update only matching doc categories, trust validator suite to catch inconsistencies
