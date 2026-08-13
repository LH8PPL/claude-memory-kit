---
id: P-7WG4WJ4W
type: project
shape: State
title: 'CI Watch Rule: Specify ci.yml by Name'
created_at: 2026-07-10T20:01:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3eda14125b234e41511b171b7f2f6cf5138acece9cf6700f24a4db640fa92ec6
related: [workflow-green-commit-green, ci-watch-pattern-must-await-all-checks-not-subset, claude-md-ci-validator-binding-rule]
---

When monitoring CI health, explicitly watch the ci.yml workflow status—not proxy signals like a passing CodeQL report. The rule is now in CLAUDE.md.

**Why:** Incident D-310: watching latched onto a green CodeQL run while ci.yml was red, so main appeared green while actually broken.

**How to apply:** Always check ci.yml state directly, not proxy indicators. This prevents false confidence about CI health.
