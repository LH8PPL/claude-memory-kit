---
id: P-KUKaB9HF
type: project
shape: State
title: Counts Validator Scope and Intentional Exclusions
created_at: 2026-07-21T06:59:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2c3165d3982c848db0e430ee7dcc1bcca0124a847c552313af8a9090c926857d
related: [doc-completeness-validator-hook-behavior-coverage-gap, task-236-counts-family-validation]
---

**Validates:** MCP tools, CLI verbs, health checks, agent profiles. **Deliberately excludes:** hook counts (too generic; false positive risk outweighs coverage). Hook-count drift remains a human review judgment call. This mirrors the pattern of glossary hook-count errors sitting undetected for months.

**Why:** Assistant explained this as intentional design: some validation gaps are safer left to human judgment than caught by brittle automation.

**How to apply:** Expect that generic nouns (like "hooks") require manual review; automation reliably covers named, countable tools and verbs.
