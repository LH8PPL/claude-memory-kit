---
id: P-X974ZW97
type: project
title: 'Kiro has FOUR install surfaces, not three (the user''s correction 2026-06-21): HO'
created_at: 2026-06-20T21:12:53Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: c07ada4fc21e4509258ffbffddaf9f6229455eff57d59ed3cb4e8d30276580e4
related: [decision-the-user-2026-06-21-the-kit-s-kiro-support-wires-al, kiro-skills-map-nearly-1-1-to-claude-code-skills-verified-fr, cli-route-fix-prompt-vs-skill-conflict-ide-cli-share-skill]
---

Kiro has FOUR install surfaces, not three (the user's correction 2026-06-21): HOOKS + STEERINGS + SKILLS + MCP. The kit's adapter model treated Kiro as 3 legs (hooks/MCP/instruction) and OMITTED skills. Kiro has a native skills surface — the kit's own skills (memory-write, memory-search) may map to it. Steering VERIFIED from real files: custom steering with 'inclusion: always' auto-loads in base/IDE mode (Taskmaster/mempalace/DesignerPunk all do this), BUT under a custom CLI agent it must be re-added via the agent's 'resources':['file://.kiro/steering/<f>.md'] array — proven by 3fn/DesignerPunk where all 8 agent JSONs re-list each steering file (also uses skill:// and fileMatch resource types). So the docs' 'custom steering dropped under custom agent' claim is TRUE + the resources-re-add fix is what real projects use.

**Why:** The user corrected my mental model: Kiro = hooks + steerings + skills + MCP. I'd been mapping only 3 of 4 surfaces. Skills is a real Kiro surface the kit should consider mapping its own skills to. Steering coexistence with agents is now verified from real DesignerPunk agent files (resources re-add).

**How to apply:** The Kiro adapter must handle FOUR surfaces: (1) hooks — IDE .kiro/hooks/*.kiro.hook OR CLI agent-config hooks; (2) steering — .kiro/steering/*.md inclusion:always, re-added via agent resources if custom agent; (3) skills — map the kit's memory-write/memory-search skills to Kiro's skill surface (VERIFY where Kiro skills live — ~/.kiro/skills? .kiro/skills?); (4) MCP — .kiro/settings/mcp.json. Verify the Kiro skills location + format from real repos before designing.
