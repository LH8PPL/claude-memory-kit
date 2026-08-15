---
id: P-XVNNRDRV
type: project
shape: Timeless
title: Name-Guard Flags Templated Patterns in Frontmatter Metadata
created_at: 2026-07-12T19:32:26Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b89fd0178fda132b394fc2bc867362bbbf95386e1ea37394f51cf133d4e9cd33
related: [strict-yaml-validation-validate-skill-sources-mjs-enhancemen, commit-guardrail-blocks-ambiguous-include-exclude-instructio, d-388-project-discipline-document-unreachable-code]
---

The project's name-guard tool catches templated/placeholder patterns in frontmatter (e.g., `«name»wiki`), classified as D-310 errors, and blocks commits. Correct pattern: use descriptive language (e.g., "the user's personal-wiki") instead.

**Why:** Built-in guard against anti-patterns in metadata documentation; understanding this prevents merge-blocking surprises during commits.

**How to apply:** When writing metadata with user-level references, use full descriptive phrases rather than short templated patterns with placeholder markers.
