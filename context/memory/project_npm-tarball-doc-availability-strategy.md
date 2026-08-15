---
id: P-NWJFG9HH
type: project
title: npm Tarball & Doc Availability Strategy
created_at: 2026-06-28T07:15:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d2a41f6e42eec3182f31b97a236c977af6c6ff5979a8881845ff8bddcf9090a6
related: [npm-package-contents-and-documentation-strategy, documentation-structure-tradeoff-in-claude-memory-kit, dual-readme-files-must-stay-synchronized]
---

- npm tarball intentionally ships **only `README.md`** to keep the package lean
- Deeper docs (`docs/CLI.md`, `docs/MCP.md`, `docs/KIRO.md`) are on GitHub only—not in tarball
- npm README links to deeper docs via absolute GitHub URLs
- npm README is kept comprehensive (includes full CLI table); root README can be leaner
- This creates a "hybrid" where npm page is a richer standalone landing, but tarball stays small

**Why:** Balances fast npm installs (lean tarball) with a complete npm landing page for package evaluation; GitHub is the canonical deep-docs home

**How to apply:** When adding/maintaining docs, keep only README.md in npm tarball. Ensure npm README is fuller than root README and includes full CLI reference. Link to GitHub docs via absolute URLs so npm visitors can reach them.
