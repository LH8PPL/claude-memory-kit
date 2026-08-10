---
id: P-6MRTBLBH
type: project
title: CLAUDE.md CI/Validator Binding Rule
created_at: 2026-06-28T12:16:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2108b83eef70a68ca7cc0f4e70fe4fb425c6e0eeb843a02c8d2f8e4b91317563
related: [release-workflow-cold-open-testing-discipline, stress-gate-required-before-pr-for-spawn-hook-boundary-chang, ci-watch-rule-specify-ci-yml-by-name]
---

Added binding rule to CLAUDE.md derived from a publish-failure lesson. **The rule:** watch CI on direct-to-main; run full validators on doc changes before committing.

**Why:** A prior publish-failure revealed CI was not checked on direct-to-main, and validators only caught the issue post-release. This rule prevents recurrence.

**How to apply:** When working on this project, before pushing or committing doc changes to main, verify CI checks pass and run the full validator suite locally.
