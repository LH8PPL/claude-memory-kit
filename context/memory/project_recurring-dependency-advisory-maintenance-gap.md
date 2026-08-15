---
id: P-FYFRFTRY
aliases: [P-FYFRFTRY]
type: project
shape: State
title: Recurring Dependency Advisory Maintenance Gap
created_at: 2026-08-05T10:46:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e670c2cf3a086e4df3e39f8a19a28e22eeffbb9d635f1f6d1a1e33dde725f726
related: [cmk-version-bumping-convention, clean-pre-existing-table-lint-warnings-by-default, minor-release-triggers-backlog-sweep]
---

Three advisory fires on transitive deps (fast-uri, hono, ip-address) landed in one week during v0.6.5 prep. Current workflow: manual triage + separate PR per fire (e.g., PR #343) to avoid coupling with features. No proactive audit cadence exists.

**Why:** Reactive handling wastes cycles and risks coupling dep fixes to feature releases. A standing cadence (e.g., scheduled `npm audit` or Dependabot-grouped lockfile bump) would catch advisories proactively.

**How to apply:** Post-v0.6.5, add a standing dependency audit task to backlog. When advisories land, check if they're part of a pattern — if recurring, the fix is a cadence, not one-off PRs.
