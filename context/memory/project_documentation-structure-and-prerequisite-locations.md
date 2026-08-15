---
id: P-9WS2CJH7
type: project
shape: State
title: Documentation structure and prerequisite locations
created_at: 2026-07-06T11:00:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 21ce97fb76f67a5e7205c35a34c711d2f187d19e5d3efe673b04e8b16424e92a
related: [claude-memory-kit-supports-3-ide-tool-agents, cut-gate-release-validation-guides-per-agent, documentation-wiring-three-stage-prevention-pattern]
---

- GitHub README (distinct from npm)
- npm README (distinct from GitHub)
- QUICKSTART doc (onboarding)
- docs/KIRO.md (existing agent surface doc)
- docs/CLAUDE-CODE.md (to create, match KIRO structure)
- docs/CURSOR.md (to create, match KIRO structure)
- DOCUMENTATION-MAP (registry for all new docs)

Prerequisite notes for each agent (Claude→`claude`, Kiro→`kiro-cli`, Cursor→`cursor-agent`) must appear in all three locations.

**Why:** The kit is distributed via GitHub and npm with separate audiences; each agent has different installation/setup prerequisites that must be clear at each entry point.

**How to apply:** Maintain parallel structure in docs/CLAUDE-CODE.md, docs/CURSOR.md, docs/KIRO.md. Update README (GitHub), npm README, and QUICKSTART. Register all in DOCUMENTATION-MAP.
