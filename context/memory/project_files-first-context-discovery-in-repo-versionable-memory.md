---
id: P-6CMJKCTH
type: project
shape: Timeless
title: Files-First Context Discovery — In-Repo, Versionable Memory
created_at: 2026-07-03T21:05:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0c0b383c27ba24623ec7e7980919c31e7166ecc0c257556200de90ea3701496e
related: [index-md-is-a-committed-human-readable-artifact, cursor-adapter-lifecycle-hooks-for-deterministic-memory-inte, cut-gate11-memory-system-three-tier-architecture]
---

Architectural differentiator: context via regular files (committed in-repo at `.claude/`, `.cursor/`, etc., versionable, traveling with `git clone`) that the agent can search and read — rather than proprietary agent-specific memory stores.

**Independent validation:** Cursor's own dynamic context discovery feature (2026 blog post) independently arrived at the same principle: "context management is files the agent can search," not proprietary memory.

**Why:** Portability across agent versions/integrations. Auditability (memory in git history). Durability (survives agent crashes, switching). Differs from MCP-only or native-memory approaches.

**How to apply:** In-repo `.claude/` and `.cursor/` directories store the portable memory layer. Prefer file-based context APIs over agent-native memory stores. Validates approach as agent-agnostic.
