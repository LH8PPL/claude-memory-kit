---
id: P-RR5a6aER
type: project
title: Testing Verification Levels
created_at: 2026-06-17T06:29:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4cdaf685d36bb34dd807f7e5abf62d5fe2b65dbdc233baf2915f728f8a00ee1a
related: [cut-gate-review-process, cut-gate-sandbox-isolation, use-mcp-mk-remember-not-bash-cli]
---

Three explicit levels:
- **Live-tested**: real binary against real repo data (e.g., `cmk search` against actual journal)
- **Unit-tested (synthetic)**: test suite with hand-written fixtures (no real data)
- **Untested (behavioral)**: not yet run in real context (e.g., MCP in real Claude session)

**Why:** Prevents false claims of completeness. Unverified paths are flagged for cut-gate review.

**How to apply:** Specify testing level when claiming "it works." Flag gaps rather than hiding them.
