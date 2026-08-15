---
id: P-EGMSHW6X
type: project
title: Install System Requirements Matrix (v0.4.0+)
created_at: 2026-06-21T18:04:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4f3a7fb45c547e030f01e53f3009f7155c70c6302bcdffece573bc82cd8d4d67
related: [install-system-dual-agent-workflows-cases-a-d, kiro-has-four-install-surfaces-not-three-the-user-s-correcti, kiro-configuration-structure-agents-md-not-claude]
---

- `--ide kiro` must NOT create `.claude/skills/` or `CLAUDE.md` (Kiro-only install should not litter Claude files; Case A)
- `--ide kiro` must NOT clobber existing `.claude/` or `CLAUDE.md` (preserve live Claude config; Case A)
- `cmk install` (Claude) must NOT clobber existing `.kiro/` or `~/.aws` agent (preserve Kiro config; Case B)
- Both installs must reuse existing `context/` (idempotent, never re-scaffold)
- `--ide kiro` must write `AGENTS.md` (Kiro's instruction file; fixes broken `prompt: file://AGENTS.md` reference)
- **New: implement `cmk uninstall --ide kiro` verb** (wire existing `uninstallKiro` code to CLI; required for clean Case D switches)

**Why:** The install design is additive — Claude Code and Kiro coexist on the same repo. These requirements ensure neither agent's install mutates the other's surfaces and `context/` is treated as immutable.

**How to apply:** Use this as the design spec for install v0.4.0+. Each requirement maps to one or more cases (A–D) that will break if unsatisfied. Prioritize: skip fresh-Claude-files on `--ide kiro`, write `AGENTS.md`, and wire the uninstall verb.
