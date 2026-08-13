---
id: P-F6GJP2QT
type: project
title: 'Claude-Memory-Kit: 5 Surfaces Architecture'
created_at: 2026-06-22T18:34:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2ab304ed3e6db22a09620efdd24f096283aeb9119c4b130c09126fd6b9a2a07f
related: [cmk-install-scaffolding-and-wiring, claude-memory-kit-health-check-suite-hc-1-through-hc-9, core-memory-kit-installed-with-claude-code-hooks]
---

The kit's integration architecture spans 5 surfaces (integration points):
- **MCP** — Anthropic/mcp server and protocol layer
- **Steering** — Decision-making logic (.kiro/steering/cmk.md)
- **Skills** — Claude-native frontmatter-based skill agents (memory-search, memory-write)
- **IDE Hooks** — Kiro IDE integration (.kiro/hooks/; requires IDE restart to activate)
- **CLI Agent Config** — AWS amazonq CLI agent integration (~/.aws/amazonq/cli-agents/)

These 5 surfaces are scaffolded and wired by `cmk install` and validated by HC-1 through HC-8 in `cmk doctor`. (HC-9 covers scaffold version matching, distinct from surface wiring.)

**Why:** Kit completeness and functionality depend on all 5 surfaces being present, configured, and connected. They form the "surface layer" of validation (distinct from the "3 tiers" depth model).

**How to apply:** After `cmk install`, verify all 5 surfaces are wired by running `cmk doctor` and checking for HC-1 PASS. Restart Kiro to activate IDE hooks after install.
