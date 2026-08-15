---
id: P-R5DMD4JK
type: project
title: Coverage Gate Fix Workflow
created_at: 2026-06-21T20:13:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cdd7bc76b0bf0a3ba216ec918b110c4748b9f6989c0f64b91b227e0d7124d4a9
related: [rununinstall-branch-coverage-map, log-sink-injection-pattern-across-install-uninstall, release-publish-workflow-git-tag-to-npm]
---

Approach taken to resolve SonarCloud coverage failure:
1. Identified root cause: coverage gap in runUninstall branches (73.9% < 80%)
2. Added test coverage for all four branches (default-claude, unknown-ide, kiro, nothing-to-remove)
3. Applied pattern consistency: made runUninstall honor injected log sinks to match runInstall
4. Verified full suite pass and 100% lines coverage for affected file (install-kiro.mjs: 2162/0)

**Why:** Systematic approach that addresses missing tests rather than superficial fixes; yields complete coverage.

**How to apply:** Apply this workflow when future coverage gates fail—identify missing branches, add tests, verify consistency with related code, re-run gate.
