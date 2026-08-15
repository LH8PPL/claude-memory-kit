---
id: P-C27GVXL9
type: project
title: 'Delete-Guardrail: Memory Protection via preToolUse Hook'
created_at: 2026-06-25T12:49:55Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7145389838944c9063985744d78b28e9a83f2524b752b72dac9cc1fd1bb18ad1
related: [kiro-cli-v3-hook-redesign-guard-dormant-fallback-active, kg-guard-kiro-cli-two-gates-rm-rewritten-to-removeitem, memory-safety-guard-prevents-agent-bypass-attempts]
---

The kit wires a `preToolUse` hook (`cmk-guard-memory`) that inspects all shell commands before execution. It blocks destructive commands (`rm`, `Remove-Item`, `git clean`, `git reset --hard`, `del`, `find -delete`, `>`-truncate) aimed at memory paths:
- `context/` directories
- `~/.claude-memory-kit` persona tier
- `MEMORY.md` and `DECISIONS.md` files

When triggered, the hook exits non-zero and outputs "BLOCKED by the claude-memory-kit delete-guardrail", preventing the tool from running. Fully operational on Claude Code and Kiro IDE.

**Why:** Motivated by D-192 incident — an accidental `rm` after a `cd` deleted a repo's session/transcript memory. The guardrail makes such unintended deletions impossible.

**How to apply:** Maintainers should understand this as the kit's primary data-loss prevention layer. Users are protected by default. See Task 166 for V3 native support.
