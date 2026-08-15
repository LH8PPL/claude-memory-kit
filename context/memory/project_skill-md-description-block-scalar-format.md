---
id: P-GATV2CKW
type: project
title: SKILL.md Description Block Scalar Format
created_at: 2026-06-23T04:47:17Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1508b54ebf38d05bf03cb47c973f815a444ab1290766db8d239b1d8b1d1189c6
related: [yaml-validator-lenient-parser-blind-spot, js-yaml-can-silently-rewrite-yaml-formatting, description-field-length-root-cause-and-fix]
---

SKILL.md descriptions must be formatted as YAML block scalars (not plain strings). This is enforced by `validate-skill-sources.mjs` using strict `js-yaml` parsing. Both existing SKILL.md files were updated to comply (PR #220). The linter runs on every `npm test` and `npm run lint:skill-sources`.

**Why:** Block scalars are the correct YAML format for multi-line text. Using plain strings breaks strict YAML validation.

**How to apply:** When creating or editing SKILL.md files, ensure descriptions use block scalar syntax (e.g., `|` for literal blocks or `>` for folded blocks), not quoted strings.
