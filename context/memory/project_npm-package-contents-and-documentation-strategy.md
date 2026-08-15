---
id: P-ZP6SQRM5
type: project
title: NPM Package Contents and Documentation Strategy
created_at: 2026-06-28T07:11:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1d1170aa6909dedbba95643020b9f1fb35bce96661e8bbb39fca303bcea07633
related: [npm-tarball-doc-availability-strategy, documentation-structure-tradeoff-in-claude-memory-kit]
---

- **Package tarball includes**: `bin/`, `src/`, `template/`, `README.md`
- **Package tarball excludes**: `docs/` directory and markdown files (intentional, reduces bloat)
- **Documentation location**: GitHub (canonical source), not bundled in npm
- **npm README linking**: Absolute GitHub URLs (e.g., `https://github.com/.../docs/CLI.md`)
- **Current gaps in npm README**:
  - MPC.md reference not prominently linked (despite being a headline feature)
  - CLI verb table truncated (~7 verbs shown; docs/CLI.md has 33+)

**Why:** npm tarballs should be lean; GitHub is the authoritative home. But npm README is the package landing page, so it must link to key docs and provide enough CLI reference for visitors to understand the full scope without leaving npm.

**How to apply:** When preparing releases, ensure npm README links all key docs via absolute GitHub URLs. Include a comprehensive CLI verb table. This gives npm visitors a complete overview while keeping GitHub the canonical deep-reference home.
