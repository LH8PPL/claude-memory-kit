---
id: P-4WHH6D72
type: project
title: CLI Installation Verification Workflow
created_at: 2026-06-25T11:21:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2599de8e224a2a50e3d46bd5b17cbb626badf969e277309da62a15600a4598ff
related: [global-cli-rebuild-and-reinstall-workflow, rebuilding-the-global-cmk-binary-after-code-changes, re-pack-verify-workflow-for-cut-gate-testing]
---

To install & verify claude-memory-kit CLI globally:
- Kill running node.exe processes from claude-memory-kit repo
- `cd C:\Projects\claude-memory-kit\packages\cli`
- `npm pack`
- `npm install -g .\<tarball-name>.tgz`
- Verify with `cmk --version`

Use this workflow after making CLI changes (e.g., #232 fix) to ensure global takes the updated version.

**Why:** Global CLI must be rebuilt after changes; verification ensures fix is active before testing downstream (Kiro IDE hooks, gate projects)

**How to apply:** When testing CLI changes in integrated scenarios, rebuild the global first, verify with --version, then test with fresh gate folders
