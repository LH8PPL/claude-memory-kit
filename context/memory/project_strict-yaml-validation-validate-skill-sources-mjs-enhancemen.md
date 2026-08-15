---
id: P-JVBPP36Z
type: project
title: Strict YAML Validation — validate-skill-sources.mjs Enhancement
created_at: 2026-06-23T04:27:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 29a0295ee225aad1400bc7cd5749f1ce6091874279dafcc871468a26175fada2
related: [yaml-validator-lenient-parser-blind-spot, skill-md-yaml-colon-space-bug, name-guard-flags-templated-patterns-in-frontmatter-metadata]
---

`validate-skill-sources.mjs` upgraded from naive lenient parsing to strict YAML parsing with integration tests. Catches invalid skill frontmatter (e.g., unquoted colons: "update memory: X is now Y") during validation, before Kiro deployment. The canonical validator now matches Kiro's strict parsing (PyYAML) instead of Claude Code's lenient parsing.

**Why:** Previous gap masked errors for months: Claude Code accepted invalid YAML while Kiro rejected it. This caused D-195. Strict validation upstream prevents cross-tool incompatibilities.

**How to apply:** When modifying skill validation or YAML parsing, use strict parsing (PyYAML semantics) and include integration tests that verify against both strict and lenient parsers.
