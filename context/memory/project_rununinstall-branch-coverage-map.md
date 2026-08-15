---
id: P-LKBB3BNU
type: project
title: runUninstall Branch Coverage Map
created_at: 2026-06-21T20:13:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7d7d38b0b51fd0af7153589f546a8d77e4b6f092b5cfabf66088b6647f845ad2
related: [coverage-gate-fix-workflow, v0-4-0-final-gate-kh-kc-live-hook-firing-tests, sonarcloud-coverage-gate-threshold]
---

The `runUninstall --ide` command has four distinct branches that must each have test coverage:
- default-claude
- unknown-ide
- kiro
- nothing-to-remove

**Why:** Missing branch coverage causes gate failure; all paths must be tested for SonarCloud to pass.

**How to apply:** When writing tests for runUninstall changes, explicitly cover each of these four branches.
