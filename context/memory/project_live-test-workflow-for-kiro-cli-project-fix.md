---
id: P-5D5PDC5E
type: project
title: Live test workflow for kiro-cli --project fix
created_at: 2026-06-24T15:27:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bbcdc3ba990da8e81524afc4bf2d873cf54dbed648783f7fb6019fe97348b80b
related: [testing-workflow-for-claude-memory-kit-fixes, d-197-end-to-end-live-re-test-workflow, fresh-folder-verification-workflow-for-claude-memory-kit-rel]
---

1. Rebuild CLI from branch with --project fix: `npm pack`, then `npm install -g .\lh8ppl-claude-memory-kit-0.4.0.tgz`
2. Create fresh test folder: `mkdir C:\Temp\kiro-cli-gate3; cd .; git init`
3. Install via cmk: `cmk install --with-semantic --ide kiro`
4. Verify args baked: `node -e "console.log(require('.kiro/settings/mcp.json').mcpServers['claude-memory-kit'].args)"`
5. Run `kiro-cli` and type a test memory command
6. Check `context/` — if the fact lands, args flowed and fix is validated

**Why:** This is the definitive live test to prove whether kiro-cli passes command-line args to stdio MCP servers. Designed to run after code commit.

**How to apply:** Execute in a clean environment to validate the fix before merging to main.
