---
id: P-VEMJ4EVR
type: project
title: exit-doors gate performs Task-137 validation
created_at: 2026-06-13T09:46:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9b7beb98b9aabe1c5fd0d63cc76cf73031775814
related: [task-135-integrated-pack-completeness-validator-into-prerun]
---

The exit-doors gate validates Door-3 header forms using Task-137 validators.
Actively caught Door-3 header form issues during Task 135 execution (showing it works).

**Why:** Documents validation chain; shows active error detection in prerun gating

**How to apply:** Rely on exit-doors gate to catch header form issues; do not bypass it
