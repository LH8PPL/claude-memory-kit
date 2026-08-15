---
id: P-QB9MR3MK
type: project
title: Kiro Hook Trust System Configuration (D-194)
created_at: 2026-06-22T20:07:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6b8238550d001e9c215aa65c1f71f9d5a2eb16426d4dc02ddf9611544a2cad45
related: [kiro-trusted-commands-auto-approve, kiro-hook-trust-quirks-design-lessons-d-194, post-d194-artifact-update-workflow-for-kiro-trust-fix-verifi]
---

Kiro IDE gates hooks behind a trust system, requiring "Run / Reject" prompts unless commands are pre-registered (unlike Claude Code, which auto-runs registered hooks).

**Mechanism:**
- Workspace `.vscode/settings.json`: field `kiroAgent.trustedCommands` (array)
- CLI side: `toolsSettings.shell.allowedCommands` (regex pattern, start-anchored)
- Commands scoped to kit's own: `cmk hook *`, `cmk-guard-memory`
- Implementation: `kiro-trusted-commands.mjs` writes to workspace config
- Array-union behavior: preserves user's existing trusted commands, idempotent, BOM-tolerant, refuse-to-clobber
- Integrated into `installKiro` and `uninstallKiro` surfaces

**Why:** Understanding the trust mechanism is essential for configuring Kiro hooks and avoiding "Run / Reject" prompts; the design preserves user customizations and prevents accidental overwrite.

**How to apply:** When adding new trusted commands or debugging hook behavior, use the field names and scope rules above; always anchor regexes to prevent unintended matches.
