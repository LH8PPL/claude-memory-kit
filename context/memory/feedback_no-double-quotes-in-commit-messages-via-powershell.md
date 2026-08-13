---
id: P-9ENZEaBS
type: feedback
title: no double quotes in commit messages via PowerShell
created_at: 2026-06-12T16:37:00Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: c44f45209ff14b6e384db14404c0b2f4258070b6
related: [vitest-workers-spawned-from-the-claude-code-bash-tool-inside]
---

PowerShell 5.1 silently mangles git commit messages containing embedded double quotes — even inside single-quoted here-strings. The commit fails with pathspec errors, and in a chained command the failure can scroll past unnoticed (it happened twice on 2026-06-12; the second time the suite output buried it).

**Why:** PS 5.1 native-argument re-quoting splits the message at embedded double quotes regardless of here-string quoting; git then parses the fragments as pathspecs.

**How to apply:** Write commit messages without any double-quote characters (rephrase: adding-new-HCs not "adding new HCs"), or commit via the Bash tool instead. Always check the commit actually landed when chaining (git log -1 or the [branch sha] line).
