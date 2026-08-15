---
id: P-AW7WKGVT
type: project
title: Multi-Site Home-Path Slug-Leak Bug Class (v0.3.3 Cut-Blocker)
created_at: 2026-06-17T13:40:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 34e5048d9a6d3dc4cff577282ef425fbbef5278538aef38766089079464df5a6
related: [truly-final-kiro-windows-allowlist-bug-5376-7431-blocks-corr, confirmed-kiro-bug-user-turn-never-captured-auto-extract-can, the-fix-use-cmk-remember-cli-not-mk-remember-mcp-in-kiro-cli]
---

- **Blocking pattern:** All three fact-writing paths share identical bug: slug derived from title BEFORE sanitization
  - `remember-core.mjs` `rememberRich`: slug from title before `sanitizeHomePaths` (user-triggered via `cmk remember`)
  - `auto-extract.mjs` `routeRichFact`: slug from title before `sanitizeHomePaths` (HIGHER RISK — automatic every turn)
  - `import-claude-md.mjs` line 284: slug from `p.text` (unconfirmed if sanitized upstream)
- **Root cause:** `writeFact` sanitizes body/frontmatter only, NOT slug — slug is derived by caller before `writeFact` is called
- **Risk ranking:** auto-extract (automatic, every turn) > remember-core (user-triggered) > import-claude-md (user-initiated import)
- **Recommended fix structure:** hoist shared `sanitizeForSlug` helper that all three callers import + use before `slugifyFact`; correct stale comment in auto-extract line 642 (falsely claims `writeFact` sanitizes the slug)

**Why:** Usernames/home paths in committed fact filenames compromise privacy—auto-extract is highest risk because it runs automatically on every conversation turn with zero user action. This is confirmed as v0.3.3 cut-blocker, not just the single-site remember-core issue.

**How to apply:** (1) Create shared helper module or consolidate into existing utils with `sanitizeForSlug` that applies both sanitizers before slug derivation. (2) Update all three callers. (3) Add regression test for auto-extract case—synthetic candidate with path in title → assert committed filename + INDEX don't contain username (use fixture self-guard to prevent vacuous-pass). (4) Trace import-claude-md provenance on `p.text` first to confirm if fix is needed there.
