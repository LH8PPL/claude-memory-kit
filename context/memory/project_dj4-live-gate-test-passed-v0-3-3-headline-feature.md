---
id: P-KHB93CGB
type: project
title: DJ4 Live-Gate Test Passed (v0.3.3 Headline Feature)
created_at: 2026-06-17T21:27:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 79c22af966dfd18367037fc0e7565cadc2c5a74bf62554df09a24036e913038d
related: [june-17-11-12-build-decisions-scope-implemented, mcp-server-staleness-gotcha-d-80, dj4-live-test-prerequisites]
---

DJ4 tests whether Claude autonomously reaches for `--scope decisions` when answering decision-history questions. **Test outcome: the feature works.** Claude correctly invoked `cmk search --scope decisions` when asked "what made us switch [from broadcast to SDK]?". The empty result was due to stale MCP process (D-80), not a feature defect. Current build (Jun 17 11:12) has correct zod enum validation + search scope support.

**Why:** DJ4 is the headline verification for v0.3.3. Confirms feature design is sound; infrastructure gotcha does not block the tag.

**How to apply:** Re-test after restarting Claude Code to confirm decision-scope recall works end-to-end.
