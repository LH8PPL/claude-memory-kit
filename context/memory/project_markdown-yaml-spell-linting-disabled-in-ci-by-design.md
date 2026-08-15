---
id: P-ECVPNG2R
type: project
title: Markdown/YAML/Spell Linting Disabled in CI by Design
created_at: 2026-06-23T06:14:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cee75b319e3a701819f9d023f06632d8365d6f5d12bd9ec5463b57bd62a1e03d
related: [linting-memory-files-produces-excessive-noise, research-notes-indexed-via-research-index-not-documentation, stress-testing-omitted-for-pure-read-cli-changes]
---

- **Status:** markdownlint, yamllint, codespell NOT run in CI or npm test; Super-Linter not integrated.
- **.markdownlint.json:** Editor config only (disables 14 rules—MD013, MD024, MD033—for deliberate house styles); no CI binary.
- **Actual enforcement:** Functional doc integrity checked by domain-aware validators (wired into npm test):
  - scripts/validate-references.mjs (link resolution)
  - scripts/validate-doc-registry.mjs (index completeness)
- **Rationale:** Generic linters would noise on 597 memory files and conflict with intentional house styles.

**Why:** Documented architectural decision that prevents accidental reintroduction of generic linters. Explains why actionlint + ShellCheck are the right CI additions (they don't touch memory files).

**How to apply:** When evaluating lint tools for CI, reference this to confirm the architectural choice. Precise, domain-aware validators for doc integrity—not generic linters.
