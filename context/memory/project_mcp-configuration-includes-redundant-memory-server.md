---
id: P-JL6M3Y5B
type: project
shape: State
title: MCP Configuration Includes Redundant Memory Server
created_at: 2026-07-27T19:05:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 61d8fefc2ff45ff749694eee7a5c87f2175f0229672859e8cc3f09f83e8415fb
related: [sonarcloud-automatic-analysis-must-be-off, hc-6-native-auto-memory-runs-alongside-kit, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

User's MCP setup runs both generic `@modelcontextprotocol/server-memory` and kit's own memory MCP concurrently. Kit MCP alone is sufficient; removing generic server saves ~270 MB.

**Why:** Redundancy creates unnecessary memory overhead; identifying and removing it optimizes resource usage and tool clutter.

**How to apply:** Check MCP config for `@modelcontextprotocol/server-memory` entry. Evaluate whether kit's memory MCP meets project needs; if so, remove the generic server.
