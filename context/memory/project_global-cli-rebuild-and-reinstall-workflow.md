---
id: P-YQ4CN37B
type: project
title: Global CLI Rebuild and Reinstall Workflow
created_at: 2026-06-24T14:24:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 439b4c9ae024780c3cacf40983602b6b25267302559f7a768a6d6a6f582dae50
related: [rebuilding-the-global-cmk-binary-after-code-changes, cli-installation-verification-workflow, artifact-rebuild-for-v0-4-0]
---

Standard sequence for distributing local changes to the global `@lh8ppl/claude-memory-kit` CLI:
- From `C:\Projects\claude-memory-kit\packages\cli`: `npm pack`
- Uninstall global: `npm uninstall -g @lh8ppl/claude-memory-kit`
- Install from local .tgz: `npm install -g .\lh8ppl-claude-memory-kit-*.tgz`
- Verify: `cmk --version`

**Why:** Needed to test CLI changes without npm publish. The uninstall+install cycle ensures clean state and avoids stale cached behavior.

**How to apply:** After code changes to CLI, rebuild this way before running integration tests against gate projects. The .tgz file lives in the same directory after `npm pack`.
