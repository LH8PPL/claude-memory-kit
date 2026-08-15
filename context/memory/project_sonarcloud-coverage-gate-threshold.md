---
id: P-9GBJ6NUQ
type: project
title: SonarCloud Coverage Gate Threshold
created_at: 2026-06-21T20:13:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9c899469321e4148b36ff943aa8e6d4e0217a82f5668bce3e58f4a21bde43e00
related: [ci-pipeline-configuration, sonarcloud-coverage-gate-at-80-on-new-code, rununinstall-branch-coverage-map]
---

SonarCloud requires 80% new-code coverage for merge approval on this project. This gate is blocking merges until coverage meets the threshold.

**Why:** Hard constraint on the release process; future PRs will fail without adequate coverage.

**How to apply:** When modifying code paths (especially in install/uninstall tools), ensure all branches have test coverage to reach 80% threshold.
