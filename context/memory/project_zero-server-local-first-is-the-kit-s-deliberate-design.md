---
id: P-5NAPNM6G
type: project
title: Zero-Server + Local-First Is the Kit's Deliberate Design
created_at: 2026-06-25T19:40:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ace0430e2e0014fdf684d3d5287f2609e8518af45d6d7f5f502cb9a338c30074
related: [everos-comparison-same-thesis-opposite-architecture-not-bett, project-origin-and-core-problem, kiro-cli-vs-kit-knowledge-extraction-architecture]
---

The kit avoids server infrastructure and external API keys, instead installing directly into Claude Code via hooks. EverOS validates this thesis — same markdown-based design, but EverOS requires server + cloud APIs (OpenRouter + DeepInfra), making it a different product class.

**Trade-off:** EverOS is more capable (shipped semantic search; principled reflection model). **Kit wins:** for its goal ("make my agent remember, no setup, no server, no keys"), EverOS cannot compete without infrastructure.

**Why:** Design choice (D-23) is validated by peer comparison. Zero-infrastructure is the kit's value prop and differentiator from peer systems.

**How to apply:** When evaluating features or changes, prioritize zero infrastructure and zero API keys. Use EverOS as a reference for "opposite architecture, same thesis."
