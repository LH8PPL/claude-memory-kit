---
id: P-AZa9JRMS
type: project
title: Contract-Lock Testing Pattern
created_at: 2026-06-17T06:58:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2c4a3d4ba5f8a4a96dd3ae0310100a7284a7cba0fc32e312b47b2f96f3ab5ec0
related: [d-163-invariant-agent-must-never-see-forgotten-facts, assertion-based-measurement-instrumentation, primary-source-verification-protocol]
---

Tests that assert the invariant or contract itself, not just that an operation succeeds or errors. Example: D-163 contract-lock test verifies "the forgotten *body never appears*" in the MCP response text, even when recovery is possible. This catches partial leaks (e.g., accidental body inclusion in search results) that a simple "error: not found" status check would miss.

**Why:** Status-code tests verify the happy/error paths but miss contract violations; contract-lock tests catch edge cases and breaches directly.

**How to apply:** When a feature touches an invariant or safety contract, add a test verifying the invariant itself (not just operation success).
