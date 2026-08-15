---
id: P-2SPaSRR7
type: project
title: Gate Guides as Standalone Documentation Siblings
created_at: 2026-06-24T09:37:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c8b1323f23edb7a0489a4c20f39830b6091b64d81e9f1c6f232285c9efb86753
related: [claude-memory-kit-supports-3-ide-tool-agents, cut-gate-backend-pattern-template-4f, cut-gate-release-validation-guides-per-agent]
---

Gate documentation exists as three independent guides:
- `cut-gate-claude-code.md` (Claude Code variant)
- `cut-gate-kiro.md` (Kiro IDE variant)
- `cut-gate-kiro-cli.md` (kiro-cli variant)

Each is self-contained with no cross-references to the others, despite following similar structure and validating the same agent/memory system. Content is duplicated where needed rather than centralized.

**Why:** Modularity ensures users can follow ONE gate variant without needing to understand or reference the others. Each guide is a complete, independent resource.

**How to apply:** When creating new gate variants, maintain the parallel, standalone structure. Duplicate shared content (validation steps, glossary, checks) rather than cross-referencing.
