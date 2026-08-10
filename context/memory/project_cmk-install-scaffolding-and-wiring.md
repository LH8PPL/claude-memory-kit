---
id: P-6GYCY7TY
type: project
title: 'cmk install: Scaffolding and Wiring'
created_at: 2026-06-22T18:34:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d1680e77417a678931257c091691332dff991d8e568d45e2905332fe9d9f08e9
related: [claude-memory-kit-5-surfaces-architecture, cmk-install-with-semantic-scaffolds-semantic-recall, kiro-has-four-install-surfaces-not-three-the-user-s-correcti]
---

Running `cmk install --with-semantic --ide <ide>` performs:
1. Installs npm packages (baseline: 25 added, 49 changed)
2. Scaffolds `context/` directory (memory storage, session logs, memory archive)
3. Wires all 5 surfaces: MCP, steering, skills, IDE hooks, CLI agent config
4. Outputs: "[name] ready for [IDE] — context/ scaffolded; mcp + steering + agents-md + skills + ide-hooks + cli-agent wired. Restart [IDE] to activate..."

Common flags:
- `--with-semantic` — enables semantic hybrid mode (embedder + similarity search); affects HC-8 and settings.json
- `--ide kiro` (or other IDE) — wires that IDE's hooks and CLI agent integration

**Why:** `cmk install` is the initialization step that scaffolds the kit and wires all integration points. Knowing what it creates is essential for validating completeness (via `cmk doctor`) and troubleshooting wiring issues.

**How to apply:** Run `cmk install --with-semantic --ide kiro` in a fresh git repo. After install, run `cmk doctor` (expect 5 PASS, 4 SKIP baseline). Then restart Kiro to activate IDE hooks. Commit the context/ directory (memory archive) but not node_modules.
