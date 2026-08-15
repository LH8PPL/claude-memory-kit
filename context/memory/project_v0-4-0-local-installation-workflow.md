---
id: P-EaGXETZL
type: project
title: v0.4.0 Local Installation Workflow
created_at: 2026-06-23T15:02:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4ade30d645deed9258e70b4da44020920bdfb67631d708cdd3d30e1131abba2b
related: [rebuild-global-cmk-cli-binary-release-process, artifact-rebuild-for-v0-4-0, rebuilding-the-global-cmk-binary-after-code-changes]
---

To install v0.4.0 locally for testing before publishing:

1. `cd C:\Projects\claude-memory-kit\packages\cli`
2. `npm pack` → produces `lh8ppl-claude-memory-kit-0.4.0.tgz`
3. `npm uninstall -g @lh8ppl/claude-memory-kit` (may warn EBUSY/EPERM on Windows for `better_sqlite3.node` — harmless)
4. `npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz`
5. `cmk --version` → verify output is `0.4.0`

**Critical:** Use the EXPLICIT filename from step 2. PowerShell does NOT glob `*.tgz` like bash; a literal `*` → ENOENT. Always paste the exact filename.

**Why:** v0.4.0 bundles all durable fixes (SKILL.md valid YAML, Kiro hooks pre-trusted, memory lint-clean). Local install confirms artifact before publishing.

**How to apply:** Before pushing the v0.4.0 tag, run this workflow to verify cmk --version outputs 0.4.0; then proceed to gate the Kiro integration.
