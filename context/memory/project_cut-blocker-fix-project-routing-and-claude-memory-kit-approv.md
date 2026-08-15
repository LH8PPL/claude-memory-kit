---
id: P-XA74FDKH
type: project
title: 'Cut-Blocker Fix: --project Routing and @claude-memory-kit Approval'
created_at: 2026-06-24T15:41:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 98b00fbf1730d3dfedcf67bd642db50082dc548365e9639e322aca421a626b0c
related: [kiro-cli-memory-integration-test-procedure, memory-persistence-validation-workflow-end-to-end, live-test-workflow-for-kiro-cli-project-fix]
---

**Root cause**: Two separate routing/approval issues prevent mk_remember facts from saving:

1. **MCP server --project argument**: Server must receive `--project <path>` to serve the correct project context. Fixed by adding arg to mcp.json mcpServers config.

2. **Tool approval routing**: mk_remember must be approved as `@claude-memory-kit` (not `@cmk` alias). Fixed by registering tool with correct name in agent config.

**Validation (end-to-end proof)**:
- Rebuild cli and install globally from patched branch
- Create fresh test folder with `cmk install --with-semantic --ide kiro`
- Verify args contain `--project <path>` at end of args array in mcp.json
- Verify allowedTools is `[ '@claude-memory-kit' ]` in ~/.kiro/agents/cmk.json
- Run `kiro-cli`, type a fact (e.g., "Always use a project-local .venv")
- Confirm fact appears in `<test-folder>/context/` without errors

Both fixes must be stacked and verified together.

**Why:** These are the two-part root cause of the cut-blocker. Validation proves both are wired correctly and facts flow end-to-end. Unblocks merge.

**How to apply:** When making changes to MCP arg passing or tool approval, follow the end-to-end validation test to confirm both work together. This is the merge gate.
