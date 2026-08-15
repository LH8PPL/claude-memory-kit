---
id: P-BWJKTNQY
type: project
title: Workspace Trust Requirement for `.claude/skills/`
created_at: 2026-06-26T20:25:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 51a54036c675e1a7939983034a19bff131c50bbf5dabe441ba6d57392fc166b6
related: [skill-gate-clicking-allow-persists-nothing-workspace-trust-i, skill-gate-is-likely-workspace-trust-one-time-not-rule-synta, skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c]
---

In Claude Code, projects with a `.claude/skills/` directory require a one-time workspace-trust acceptance before permission rules take effect.

Per the docs (line 364 at code.claude.com/docs/en/settings):
> "For skills checked into a project's `.claude/skills/` directory, `allowed-tools` takes effect **after you accept the workspace trust dialog for that folder**, the same as permission rules in `.claude/settings.json`."

Until the trust dialog is accepted, the project's permission rules in `.claude/settings.json` (including `Skill()` allow-lists) are **inert**.

**Why:** This is a security model in Claude Code. The trust dialog gates all permission rules and skill load for untrusted folders, preventing execution of unreviewed code.

**How to apply:** When opening a project with `.claude/skills/` in VS Code/Claude Code, accept the "Do you trust the files in this workspace?" dialog once. After acceptance, the kit's permission rules take effect.
