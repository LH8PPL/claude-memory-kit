---
id: P-XULJP7RH
type: project
title: Publish Trigger is Git Tag Push, Not Branch Commit
created_at: 2026-06-21T14:43:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9f56b57b20c4a628df66ba5e06c81c55d8d1d1258626be3274c2828d36fbc644
related: [two-phase-release-commit-gate-then-tag-publish, release-workflow-tag-timing-after-gates, release-workflow-tag-driven-automation-via-publish-yml]
---

The publish.yml GitHub Actions workflow fires ONLY when pushing a git tag matching v* (e.g., `git push origin v0.4.0`), not on regular branch commits. The release script's hint may suggest `git tag && git push origin HEAD --tags` as a combined line—ignore the `--tags` part. The gate specifies `git push origin main` (commit-only) first, then `git tag v0.4.0 && git push origin v0.4.0` (tag-only) as the final, deliberate publish step.

**Why:** The safety model depends on decoupling the ordinary commit from the publish trigger. A bundled tag+push risks publishing before all gates have run.

**How to apply:** Always push commits with `git push origin main` (no tags). Reserve `git tag v*` + `git push origin v*` for after final gate approval, as the explicit publish action.
