---
id: P-FSJ93TaZ
type: project
title: Kiro CLI auto-loading verified (D-181 follow-up, kiro.dev/docs/cli/steering prim
created_at: 2026-06-20T20:43:43Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 4c19e23cfce2bbb88f630a0288e283fbbf6c573fd4bba3cfc2357643caf4ed5c
related: [kiro-cli-hooks-gap-d-181-follow-up-found-by-reading-kiro-dev, kiro-has-four-install-surfaces-not-three-the-user-s-correcti, kiro-skills-map-nearly-1-1-to-claude-code-skills-verified-fr]
---

Kiro CLI auto-loading verified (D-181 follow-up, kiro.dev/docs/cli/steering primary): only FOUNDATION steering files (product.md/tech.md/structure.md) auto-load every session. CUSTOM steering files (like .kiro/steering/claude-memory-kit.md) are NOT auto-loaded — they need explicit inclusion in an agent's resources. 'inclusion: always' frontmatter is an IDE-steering concept the CLI steering docs do NOT mention. THE AUTOMATIC INSTRUCTION SURFACE FOR KIRO CLI IS AGENTS.md: the docs say 'AGENTS.md files are always included' + 'picked up by Kiro automatically' when in workspace root or ~/.kiro/steering/. So the kit's AGENTS.md rung (50.G) is the CORRECT automatic surface for Kiro — NOT the custom steering file the current profile writes.

**Why:** The current Kiro profile writes a custom steering file assuming inclusion:always auto-loads it (IDE convention). The CLI docs contradict this: custom steering needs agent-resources inclusion; AGENTS.md is the auto-loaded surface. So the profile's instruction leg is wired to a file the CLI won't auto-read.

**How to apply:** Rework the Kiro profile: use AGENTS.md (or ~/.kiro/steering/AGENTS.md) as the auto-loaded instruction surface instead of (or in addition to) the custom steering file. Combined with MCP (auto, verified), this gives automatic recall WITHOUT needing the manual-only custom-agent hooks. The hooks (auto-capture) remain the one genuinely-manual gap; AGENTS.md can instruct the agent to call cmk tools as a partial substitute. Verify AGENTS.md auto-load live with kiro-cli before claiming it.
