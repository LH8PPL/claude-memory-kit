---
id: P-DTVMCA59
type: project
title: Precise, Domain-Aware Validators Over Generic Tools
created_at: 2026-06-23T06:07:26Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b60aa6ec1336bb743ce68d85b49c2b9088370365ecae3d6f57a16006593c7c5f
related: [strict-yaml-validation-validate-skill-sources-mjs-enhancemen, yaml-validator-lenient-parser-blind-spot, doc-completeness-validator-hook-behavior-coverage-gap]
---

The kit uses a custom, strict lint toolchain (`validate-skill-sources`, 20 validators) that understands the SKILL.md and Kiro YAML contracts, rather than generic off-the-shelf linters (e.g., Super-Linter). The strict parser now rejects invalid SKILL.md frontmatter, catching domain-specific errors early.

**Why:** Generic linters do not understand the kit's contracts (SKILL.md structure, Kiro integration); precise, custom validators catch errors that off-the-shelf tools would miss.

**How to apply:** When adding new lint checks, extend the custom validator suite rather than adopting generic tools. Keep validators focused on the kit's specific contracts.
