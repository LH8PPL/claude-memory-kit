---
id: P-V9KUSZJM
type: project
title: Fact Currency and Auto-Supersession Not Yet Implemented
created_at: 2026-06-19T21:10:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6d5fa52d97010fbb4d658b31afa67961e42f1b4ed36f2ea0d3e0fc64ab680500
related: [kit-s-decision-log-manual-maintenance-pattern, frozen-decision-log-philosophy, project-decision-trail-lane-preservation-habit]
---

When multiple versions of a fact exist (e.g., old `ChatService` architectural pattern vs. new `ClaudeAgentService`), the kit returns both in search results without auto-filtering or auto-selecting current. The recall system surfaces this honestly (flagging ambiguity: "both are live; app likely evolved") rather than hiding it, but auto-supersession logic is not yet implemented.

**Why:** Projects evolve and generate multiple generations of design docs; the kit needs a way to surface current facts authoritatively. Task 66/95 planned for v0.4.

**How to apply:** When a search returns seemingly-conflicting facts, scan timestamps/metadata to identify current. Document the supersession relationship in the newer record (e.g., "supersedes: <older-fact-id>") as a manual workaround until auto-supersession lands.
