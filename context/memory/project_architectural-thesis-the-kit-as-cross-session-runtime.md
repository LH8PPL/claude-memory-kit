---
id: P-C34QJaNC
type: project
title: 'Architectural Thesis: The Kit as Cross-Session Runtime'
created_at: 2026-07-01T15:04:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 032cd7410d9f8a819564b2b1ae39f0d9b080c2236fbf67918b9e51ff2f3a5f70
related: [episode-based-architecture-principle-refined, claude-memory-kit-judge-as-the-per-host-adapter, claude-code-vs-kiro-hook-architecture-difference]
---

**Core framing:** Claude Code runs in bounded sessions that start and end independently. The kit is the substrate that spans those boundaries, making N disconnected runs behave like one continuous agent.

**Why the learning loop is inevitable:**
- A single session can't see the feedback on its own outputs (did the user correct it? did a later task need it?). That signal arrives *in the next session*.
- The feedback loop is *structurally cross-session* — it can only close across the boundary the kit spans.
- No single session is long enough to close the loop; the kit is the only thing that lives long enough.

**Universal pattern:** This applies to any bounded-session harness (Claude Code, Hermes, OpenClaw, Kiro). All have the same architectural hole: sessions end before feedback arrives. The kit is the same shape of glue for all of them.

**One-liner:** A session is a bounded agent run. The kit is the runtime that spans the boundaries — which makes it the only place a cross-session learning loop can live.

**Why:** This is the foundational framing for the kit's architecture and the learn-loop inevitability. It explains why the loop is not optional but structurally forced. It's the thesis that will anchor the ADR and guide future work.

**How to apply:** Use this framing to justify design decisions in the ADR. Test future work against it — does it reinforce or undermine the thesis? Refer back when explaining the kit's purpose and necessity.
