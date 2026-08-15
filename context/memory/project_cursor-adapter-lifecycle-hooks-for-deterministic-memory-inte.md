---
id: P-2YFKGCRH
type: project
shape: State
title: Cursor Adapter Lifecycle Hooks for Deterministic Memory Integration
created_at: 2026-07-03T21:05:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d541d90ff7cdba80761f621dd5c55861865e278547ff47a1a11f1bebcae4a53f
related: [related-projects-mimir-memex-mcp-only-memory-integrations, files-first-context-discovery-in-repo-versionable-memory, cursor-memory-feature-removed-in-v2-1-x-design-impact]
---

**Three lifecycle hooks:**
- `sessionStart` → inject memory via `additional_context` payload
- `afterAgentResponse` → capture new context/memory
- `beforeShellExecution` → guard against destructive operations

**Core innovation:** Deterministic fire cycle avoids "judgment-call failure" of MCP-only integrations (Mimir, memex), where agent must decide to invoke memory tools. Hooks fire automatically.

**Parity:** Matches Claude Code's dynamic inject; real feature equivalence, not static-rule approximation.

**Why:** Automatic, judgment-free memory capture/injection. Differentiates from MCP-only approaches and addresses Cursor user demand for lost native memory.

**How to apply:** Validate in Task 196 review that three hooks are wired, tested (5 cycles committed per prior entry), and flow is deterministic end-to-end. Each hook must fire without agent judgment.
