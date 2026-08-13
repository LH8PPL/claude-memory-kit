---
id: P-3U4WSVEM
type: project
title: Autopilot Stop-Condition for Install-Surface Decisions
created_at: 2026-06-15T19:36:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2ca0bc98195e56851c0dacdf63b33086cff9b579b20e126acf3f7d8f1e4e752b
related: [autopilot-merge-rules-for-install-surface-changes, autopilot-grant-practice, grill-style-design-decision-process]
---

When a task decision affects install surface (package.json, npm dependencies, node:sqlite experimental status), assistant stops and escalates to user for explicit direction rather than deciding autonomously.

**Why:** Install-surface changes have high blast radius and warrant explicit user judgment.

**How to apply:** In future work, recognize install-surface implications and escalate for decision before proceeding.
