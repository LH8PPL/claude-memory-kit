---
id: P-FFQDSQEV
type: project
title: kiro-cli env-passing limitation
created_at: 2026-06-24T15:27:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 45d923dcaae700aa5b9d07b14c805129a9606fda146fd1b89704ed90bb4509be
related: [kiro-cli-project-workaround-for-project-path-passing, kiro-cli-mcp-server-env-passing-limitation, cursor-supports-headless-agent-cli-cursor-agent-p]
---

kiro-cli's changelog explicitly documents that `env` is only passed to registry-type MCP servers, not stdio servers. This blocks the kit's original env-based approach (`process.env.CLAUDE_PROJECT`) from working when kiro-cli invokes the kit via stdio.

**Why:** This limitation was discovered during debugging and is documented in kiro's own changelog. It is a hard constraint of how kiro-cli routes configuration to MCP servers.

**How to apply:** Do not rely on env for passing the project path to the kit via kiro-cli stdio. Use command-line args instead (the --project workaround).
