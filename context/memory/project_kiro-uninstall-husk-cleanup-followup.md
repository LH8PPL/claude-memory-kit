---
id: P-YSEUSMB4
type: project
title: kiro-uninstall-husk-cleanup-followup
created_at: 2026-06-22T12:19:53Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 4d15ea7e1bdbd40bf6053b5e3bbbb4156286a4b6d41936b0d02936e67efead13
related: [uninstall-end-to-end-verification-results, kiro-cli-auto-loading-verified-d-181-follow-up-kiro-dev-docs, kiro-kiro-hook-path-lesson-2026-06-21-paths-in-a-kiro-hook-c]
---

uninstallKiro leaves empty husk files: .kiro/steering/cmk.md (dead frontmatter), .kiro/settings/mcp.json ({}), and an empty AGENTS.md — it strips our managed content but doesn't remove a now-empty file the kit created. Minor; uninstall is conservative-correct, just messy. Follow-up: remove a kit-created file when uninstall empties it (mirror pruneEmptyParent), only when no user content remains outside our markers.

**Why:** Found dogfooding cmk uninstall --ide kiro on the dev repo (D-189). Empty husks are ugly and could confuse a user into thinking uninstall failed.

**How to apply:** In uninstallKiro: after removeManagedBlock/removeJsonKey, if the resulting file is empty (or only-frontmatter / {}), and the kit created it, delete it. Guard: never delete a file with user content outside our markers.
