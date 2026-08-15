---
id: P-M5BFNR3R
type: project
title: Two Distinct Memory-Recall Mechanisms in the Kit
created_at: 2026-06-28T11:56:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fb5946f0cae3a0931a61bbbd9677b31bbd756a3e174cedd5c062b86241a5bdb7
related: [auto-recall-agents-are-blind-to-tombstoned-facts, dogfood-memory-architecture-session-recall-vs-authoritative, cmk-install-activation-and-native-memory-options]
---

The kit implements two different memory-retrieval patterns:

- **Passive injection**: SessionStart hook auto-loads relevant memory into every session's context before the user types.
- **Active recall**: User-initiated semantic search (mk_search) for on-demand memory lookups.

These have different purposes and UX. The passive half ("there before you ask") is the kit's signature differentiator vs. manual retrieval-based systems.

**Why:** When describing or pitching the kit, conflating these mechanisms under a single "recall" concept obscures both its architecture and its value. The auto-load is often the more surprising and valuable feature.

**How to apply:** In all messaging, docs, taglines, and feature lists: describe and name these mechanisms separately. For passive: use "auto-injected at session start," "surfaced at session start," or "there before you ask." For active: use "recalled by meaning," "semantic search," or "memory search."
