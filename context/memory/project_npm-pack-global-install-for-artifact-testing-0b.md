---
id: P-MGMaR2MH
type: project
title: npm pack + Global Install for Artifact Testing (§0b)
created_at: 2026-06-21T14:43:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2734487b8bc3853b96fe05b8aaada1a6b1c61b63f40b87b79433a1f57a44b425
related: [artifact-rebuild-for-v0-4-0, v0-4-0-local-installation-workflow, rebuilding-the-global-cmk-binary-after-code-changes]
---

The §0b build-and-test gate:
1. `cd packages/cli && npm pack` → outputs a .tgz file (e.g., lh8ppl-claude-memory-kit-0.4.0.tgz for v0.4.0; name varies with version).
2. `npm uninstall -g @lh8ppl/claude-memory-kit` (remove old global).
3. `npm install -g .\<filename>.tgz` (use exact filename from step 1).
4. `cmk --version` → must print 0.4.0 (gate G0). If it shows 0.3.5 or older, the global install picked up a stale cached copy.

**Why:** Ensures the production tarball builds correctly and the global CLI binary is the new version before any integration testing.

**How to apply:** If npm pack prints a different filename, use that exact name in the install command. Gate G0 is critical: `cmk --version` must match the target version. If it doesn't, investigate the global install before advancing to §0c.
