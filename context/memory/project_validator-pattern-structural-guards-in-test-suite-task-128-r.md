---
id: P-X5VHDWAE
type: project
title: 'Validator pattern: structural guards in test suite (Task 128 reference)'
created_at: 2026-06-11T11:34:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d60c4749c3ce13fab7ee5dee0b4e14bde867fe1e
related: [reliable-tarball-file-validation-with-npm-pack-json, doc-completeness-validator-hook-behavior-coverage-gap, validation-pipeline-for-claude-memory-kit-includes-format-an]
---

Validators are small scripts (~30 minutes) integrated into the `npm test` suite as structural guards.
Task 128 established the pattern; Task 134 (deferred post-tag) will add a template file completeness validator following the same approach.

**Why:** Converting manual verification steps into permanent test-time guarantees catches silent failures (e.g., missing template files) early, not at user time.

**How to apply:** When adding structural checks, write a small validator script and integrate it into the test suite following the Task 128 pattern, not as a separate manual step.
