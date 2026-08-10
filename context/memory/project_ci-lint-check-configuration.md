---
id: P-Z9KHPV72
type: project
title: CI Lint Check Configuration
created_at: 2026-06-23T06:07:26Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c3bcb8449fcb946e2a761876c788ac750fea8158ae222eca1d6946d293804cfc
related: [sonarcloud-as-security-gate-for-redos-detection, reliable-tarball-file-validation-with-npm-pack-json, ci-pipeline-configuration]
---

The CI now includes a named job `Lint (structural validators)` that runs in ~2 minutes and fails fast on any validator error. Single source of truth for lint: `npm run lint` script, which runs 20 structural validators. The test suite is configured as `npm test` = `npm run lint && vitest run`, ensuring no drift between standalone lint and CI lint.

**Why:** Previously, lint checks existed but were invisible (buried in the full test suite) and used a lenient parser. The new explicit, fast-failing CI job provides immediate feedback and makes lint failures visible in PR status checks.

**How to apply:** Keep all 20 validators in the `npm run lint` script; ensure the CI workflow includes the `Lint (structural validators)` job as a fast, separate check before or alongside other test jobs.
