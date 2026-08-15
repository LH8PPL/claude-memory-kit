---
id: P-PDKUW4UG
type: project
shape: State
title: Native-Binary Swap Test Uses v13 Bundled Binaries
created_at: 2026-07-21T18:33:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fd69f302e7b42cc24d5dbd048781b0229ba11358b70e181b54e97ed935609c79
related: [ci-pipeline-configuration, production-code-must-go-through-pr-ci, core-memory-kit-dogfoods-its-own-memory-system]
---

The cross-OS native-binary swap test (CI's load-bearing check) installs the kit with v13's bundled binaries and runs `doctor` clean on each OS: windows-2022, macos-14, ubuntu-22.04.

**Why:** Validates that bundled binaries work correctly across all target platforms before shipping a native-binary version change.

**How to apply:** When reviewing native-binary PRs or examining CI results, this cross-OS test using v13 binaries is the definitive check for native-binary compatibility.
