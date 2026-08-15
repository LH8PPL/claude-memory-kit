---
id: P-SSTU3RL4
type: project
title: Release Gate Workflow and Final User Control
created_at: 2026-06-15T04:40:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 762deff956de938f5f8c72fb40f894448a67468e9ad598943029da7762f211bb
related: [release-workflow-for-claude-memory-kit, release-workflow-for-lh8ppl-claude-memory-kit, release-workflow-with-cut-gate-testing]
---

- **Staging steps** (assistant-driven):
  - Commit and push all fixes to release branch (e.g., PR #184).
  - Run full CI suite: Sonar gate, test suite, reference validation.
  - Once green, squash-merge release branch into `main`.
  - Verify `main` matches `origin/main` (working tree clean).
  - Finalize `package.json` version and CHANGELOG: bump version, finalize release section, reset [Unreleased] below it.
- **Outward gate** (user-controlled):
  - User executes: `git tag v0.3.1 && git push origin v0.3.1`.
  - This triggers `publish.yml`: test suite, npm publish with provenance, GitHub Release creation.

**Why:** Ensures all checks pass before any publishable artifact is created. User retains final control per D-126 (no auto-tagging from CI).

**How to apply:** Follow this workflow for each release. Staging is shared; tagging is user-only. The user's final tag + push command is the publication trigger.
