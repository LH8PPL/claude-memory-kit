---
id: P-2VNQDPBE
type: project
shape: Relationship
title: Letta – Architectural Comparison to Core-Memory-Kit
created_at: 2026-07-19T20:04:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6d7148e4441c09bb7d2a62283b3fccafe33b09cd32339ef15d0d450b132abb25
related: [zero-server-local-first-is-the-kit-s-deliberate-design]
---

Letta (GitHub: letta-ai/letta) is an LLM operating system addressing memory hierarchy + agentic recall—same problem space as kit, different architectural bets.

**Three-axis comparison:**
- **Where it sits**: Letta = agent runtime (agents built inside); kit = plugin for existing agents (Claude Code, Kiro, Cursor, Codex)
- **Memory substrate**: Letta = DB-backed server-side (rows + vector store); kit = markdown in repo (git-native, human-readable)
- **Write path**: Letta = agent self-edits memory; kit = screened writes (secrets/PII/injection gates), provenance, conflict queue

Cited 74× in kit research base. Deep code read initiated 2026-07-19.

**Why:** Closest shipped sibling in memory-hierarchy design space. Architectural contrast directly informs kit design decisions and risk assessment.

**How to apply:** Use three-axis framework for positioning new systems. Reference Letta when evaluating kit runtime vs. plugin architecture or memory substrate strategy.
