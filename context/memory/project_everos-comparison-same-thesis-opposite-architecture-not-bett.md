---
id: P-B3HBA67G
type: project
title: EverOS comparison — same thesis opposite architecture not better
created_at: 2026-06-25T19:39:56Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: c65426ca2ed64fb36f3f0e77febf2f7f9dd88afa208faa14eefc6cbe39d6b579
related: [zero-server-local-first-is-the-kit-s-deliberate-design, fts5-and-sqlite-vec-are-chosen-by-design-per-adr-0002-and-ad, codemem-validates-multi-cli-auto-detect-approach-in-producti]
---

EverOS (EverMind-AI, github.com/EverMind-AI/EverOS) is NOT better than the kit — it's a DIFFERENT product class with the SAME thesis. Same: markdown source-of-truth + local SQLite/vector index (validates ADR-0002 by convergence). OPPOSITE: EverOS runs as a SERVER and REQUIRES OpenRouter+DeepInfra cloud API keys ("no in-process library mode"); the kit is zero-server, works with no API key, installs INTO the coding agent via hooks (D-23). EverOS is the mem0/Zep/AgentCore class (a memory runtime you build apps against); the kit is the claude-mem/OpenWolf class (makes your existing agent remember, zero setup). EverOS is AHEAD on semantic search (LanceDB shipped vs our deferred Task 65) + a more principled reflection (Select→Merge→Re-extract→Deprecate — steal for Task 151). The kit wins decisively for its actual goal.

**Why:** The user asked "is this better than us?" after finding EverOS. The honest answer requires separating product class from quality: EverOS is more capable as a standalone memory backend but gave up the kit's entire edge (zero-server, zero-setup, no-key, hooks-into-the-agent). Judging "better" without that distinction would be the lazy-framing class. EverOS also validates ADR-0002 by convergence and offers a reflection model worth borrowing for Task 151.

**How to apply:** When comparing the kit to a peer, separate PRODUCT CLASS (memory-runtime-you-build-against vs agent-companion-that-installs-into-your-agent) from CAPABILITY. The kit's edge is zero-server local-first hooks (D-23); a more capable server product is not 'better' for the kit's goal. Steal EverOS's reflection (Select→Merge→Re-extract→Deprecate w/ frontmatter deprecated_by) for Task 151 + the consolidation layer; do NOT adopt its server/cloud-keys model.
