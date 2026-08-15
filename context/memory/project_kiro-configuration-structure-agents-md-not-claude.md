---
id: P-ZWDH5NKZ
type: project
title: 'Kiro Configuration Structure: AGENTS.md, Not .claude/'
created_at: 2026-06-21T17:56:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e2b867085b00f109520e4937d71f2398c6e2fdaeefab09694a77d6939815b6eb
related: [kiro-has-four-install-surfaces-not-three-the-user-s-correcti, install-system-requirements-matrix-v0-4-0, kiro-cli-auto-loading-verified-d-181-follow-up-kiro-dev-docs]
---

Kiro auto-loads configuration from `AGENTS.md` (project root) or `.kiro/steering/` — it does NOT read `.claude/` or `CLAUDE.md`.
- AWS agent-toolkit rule: Claude Code → `CLAUDE.md`; Kiro → `.kiro/steering/*.md`
- Reference: AWS graph-explorer (real Kiro project) has `AGENTS.md` + `.kiro/`, NO `.claude/`
- `AGENTS.md` is Kiro's instruction surface and cross-tool standard

**Why:** claude-memory-kit was generating unnecessary `.claude/` structure for Kiro projects, which Kiro ignores. Proper setup uses AGENTS.md at root only.

**How to apply:** kiro --ide kiro mode should skip `.claude/CLAUDE.md` and `.claude/skills/`. Write `AGENTS.md` at project root with memory-awareness content (same substance as CLAUDE.md steering block).
