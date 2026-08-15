---
id: P-RWG93HDR
type: project
title: Episode-Based Architecture Principle (Refined)
created_at: 2026-07-01T15:17:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c83890ba20adee2a90f3360b81bb39a70da50aaf0c26406a25268ca0101e7d82
related: [architectural-thesis-the-kit-as-cross-session-runtime, sre-workflow-as-reference-implementation, reference-implementation-alignment-strategy]
---

All systems work in bounded episodes (sessions, alerts, tasks), not continuous streams. Every distinction (IDE vs agent, session vs run, autonomous vs human-steered) reduces to episode *length*. Kit abstracts over gaps and episode types, making it harness-agnostic.

Key reframing: Kit is not a memory feature bolted onto Claude Code—it is the cross-session runtime that bounded harnesses lack. For any episodic system, the kit is the only thing that lives in the gaps.

**Why:** Clarifies kit's abstraction level and applicability. Not special to Claude Code; works for any bounded-episode system (SRE, scheduled tasks, Hermes, OpenClaw, etc.).

**How to apply:** When evaluating new harness/use case: "does this work in bounded episodes?" If yes, kit applies. Abstract over gaps, not episode types.
