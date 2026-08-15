---
id: P-BDPLJ5AQ
type: project
shape: State
title: Patch Release Strategy
created_at: 2026-07-18T13:55:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ba68514b0a153ee4092e4da0a0c4a5284511428b0f6fd0366aa7211cf0da9907
related: [versioning-rule-d-24-minor-carries-one-differentiator, d-24-constraint-patch-releases-skip-d-248-backlog-sweep, sonarcloud-advisory-role-in-ci-gating]
---

Patches (v0.5.x) are cut on-demand, not pre-planned. A new patch version is triggered only when user-facing fixes accumulate in [Unreleased]. [Unreleased] is currently empty — all work on main since v0.5.5 is internal (research notes, decisions, dev-dependencies, CI, tests).

**Why:** Prevents unnecessary release churn; users only receive patches for genuine user-facing fixes. Clarifies why v0.5.6 does not pre-exist.

**How to apply:** When planning releases, check [Unreleased]. If empty, proceed to the next minor version. Cut a patch only when [Unreleased] contains user-facing fixes.
