---
id: P-ECF3UXBP
type: project
title: Kiro Hook Trust Quirks & Design Lessons (D-194)
created_at: 2026-06-22T20:07:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6310661b86677048c223d10c755d47ac4d5ae12617a5dfb1f4d4e086bcdc7148
related: [kiro-hook-trust-system-configuration-d-194, kiro-trusted-commands-auto-approve, d-194-fix-merged-to-main-pr-219-commit-96f57c9]
---

**Key quirks discovered during D-194 integration:**
- Corrupt `.vscode/settings.json` was previously fatal (aborted install); now non-fatal with warning + skip (graceful degradation)
- CLI regex must be start-anchored (`^cmk hook .*`) — unanchored regex could match mid-string commands
- Uninstall trust removal uses exact-string matching (low collision risk, documented in code)

**Design principles:**
- Never use blanket wildcards (kit commands only, scoped narrowly)
- Preserve user's existing settings (array-union, not overwrite)
- Security: no injection paths, tested for blanket-wildcard regressions

**Why:** These quirks represent edge cases + gotchas discovered in live testing; design principles prevent future bugs and security issues.

**How to apply:** When extending or debugging trusted-commands, remember: test with corrupt settings.json, anchor regexes, never widen scope beyond kit commands, preserve user config.
