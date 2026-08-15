---
id: P-ZV6DT5WA
type: project
title: Release Merge-Gate Workflow
created_at: 2026-06-15T04:29:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: aab9288e6ebdcf56df5cf7d3c4a290ace909217b382d51a4b6fd2d59fbb4b09d
related: [release-workflow-tag-timing-after-gates, pre-release-ci-gate, release-gate-workflow-and-final-user-control]
---

Before squash-merging a release PR into main:
- Verify SonarCloud quality gate passes (new_coverage threshold met, no new security hotspots)
- Confirm PR CI fully passes (all tests green)
- Ensure "the rest is green" (all other status checks)

Only if all gates pass: squash-merge PR → pull main locally → user tags & pushes (`git tag v<version> && git push origin v<version>`).

**Why:** Gate checks prevent shipping broken or incomplete releases; mandatory discipline for release safety.

**How to apply:** Apply this gate-check-before-merge discipline to every release. Do not merge if any gate fails.
