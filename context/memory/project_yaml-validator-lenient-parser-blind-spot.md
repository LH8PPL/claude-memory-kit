---
id: P-WFF3CFAa
type: project
title: YAML Validator Lenient Parser Blind Spot
created_at: 2026-06-23T04:47:17Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d2c277f57957d9339421a42098c41446f690fa5b3f66347cc1a77475a50858bf
related: [skill-md-description-block-scalar-format, strict-yaml-validation-validate-skill-sources-mjs-enhancemen, precise-domain-aware-validators-over-generic-tools]
---

The old `validate-skill-sources.mjs` used a custom lenient parser (naive line-split) that failed to catch invalid YAML. Specifically, it did not detect SKILL.md descriptions lacking block scalars. Fixed by switching to strict `js-yaml` parsing (PR #220, commit b5f37a6). Added a regression test to prevent the parser from reverting to leniency.

**Why:** Custom parsers can be dangerously lenient and hide real validation bugs, especially risky for YAML where strictness matters.

**How to apply:** When writing validators for YAML/JSON, use the strict standard library parser (js-yaml, not custom). Write tests that confirm the validator catches known-bad inputs.
