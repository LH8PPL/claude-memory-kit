---
id: P-QURQGMAV
type: project
title: Conservative uninstall scope — managed surfaces only, never `context/`
created_at: 2026-06-21T18:09:06Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8071f76c81c30b51d283d5866e6bacdffeb23914ad070ccf29346143eb6f7bb3
related: [install-system-dual-agent-workflows-cases-a-d, semantic-config-is-shared-agent-neutral-setting-in-context-s, uninstall-end-to-end-verification-results]
---

- `cmk uninstall` removes only Claude Code managed surface (CLAUDE.md block + hooks), does not delete `context/` or even fully remove hooks
- Proposed `cmk uninstall --ide kiro` extends symmetrically: removes Kiro managed surfaces (.kiro/ blocks + ~/.aws agent) but never touches shared `context/`
- Design principle: each `--ide` owns its own install AND uninstall; `context/` (shared brain) is inviolable

**Why:** Minimizes accidental data loss and respects shared-brain architecture. Symmetric design makes tool behavior predictable and safe.

**How to apply:** When reviewing future uninstall behavior, verify it touches only agent-specific managed surfaces, never `context/`. This guards against deletion of irreplaceable shared state.
