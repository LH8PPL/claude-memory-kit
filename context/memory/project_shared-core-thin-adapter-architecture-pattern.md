---
id: P-HFQPUGUD
type: project
title: Shared Core + Thin Adapter Architecture Pattern
created_at: 2026-06-21T10:39:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0b2455d4b2ebc66675ce23221a7bf4e29172303afde49c95ce50840673565406
related: [kiro-vs-claude-code-integration-the-core-is-shared-verified, kiro-ide-vs-cli-hooks-verified-quote-from-an-aws-builders-ar, claude-code-vs-kiro-hook-architecture-difference]
---

The claude-memory-kit follows a "shared core + thin per-agent adapter" pattern:
- **Shared Core** (95% of the kit): Store / search / compression / dedup / Poison_Guard / Inject + capture logic / MCP server / cmk CLI — identical across all agents (Claude Code, Kiro, etc.)
- **Per-Agent Adapter** (~50 lines per agent): Translates that agent's native inputs/outputs to/from the core's expected shape (e.g., `kiro-hook-bin.mjs` for Kiro)
- This is an instance of "deep module, narrow interface": a large shared core with a small per-agent adapter layer

**Why:** Different agents have fundamentally different input/output contracts; the core must be shared for consistency and maintainability, but the adapters must differ

**How to apply:** When adding or modifying agent integration, preserve the shared core and only touch the thin adapter code. When reviewing for duplication, verify that similar code between agents is in a per-agent adapter (unavoidable) vs. should be in the core (refactoring opportunity)
