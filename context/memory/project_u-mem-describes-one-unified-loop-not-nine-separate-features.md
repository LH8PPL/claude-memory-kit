---
id: P-VHKZAB2Y
type: project
title: U-Mem Describes One Unified Loop, Not Nine Separate Features
created_at: 2026-07-01T13:48:00Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 94b517a7b05c2e0d5275fd082985d2391003ead24016c430db03920ec5f7984c
related: [memory-learn-loop-as-converged-system, recurrence-roi-advantage-update-is-internal-learning-signal, four-flavors-of-memory-improvement-systems]
---

The U-Mem research paper (Lines 50, 87, 89, 151) describes a single closed-loop system: the Retrieve-Infer-Evolve cycle. Four functional organs:
- **Acquire** (cascade-sampling) — candidate memories into view
- **Retrieve** (Thompson sampling) — rank and inject based on utility
- **Measure** (advantage-update) — compute feedback: did this memory help? (with-vs-without score)
- **Curate** (consolidation) — keep high-utility, discard low-utility

The loop runs continuously; feedback drives next curation.

Kit backlog scattered across Tasks 23, 55, 95, 179/180, 189 are fragments of this ONE system, not separate features.

**Why:** Earlier analysis atomized the paper into 9 disconnected ideas, missing that it's a systems paper describing unified architecture. Recognizing it as one loop clarifies what the kit needs—a coherent feedback architecture, not 9 independent additions.

**How to apply:** Reference this loop as the design blueprint for memory improvement (Tasks 179/180). Reframe backlog items as organs of the loop. Treat U-Mem as the reference architecture.
