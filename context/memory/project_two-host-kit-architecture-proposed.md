---
id: P-MF5UKYKB
type: project
title: Two-Host Kit Architecture (Proposed)
created_at: 2026-07-01T14:12:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 200b1ef54f16852534a189f7f69dc837216f0ed8090d2d91196f3c0bece1df39
related: [claude-code-vs-kiro-hook-architecture-difference, memory-tier-boundaries-kit-health-signals, memory-learn-loop-as-converged-system]
---

The kit is proposed to function in two contexts:
  - **IDE host:** Memory extraction and storage engine
  - **Agent host:** Memory that learns — receives feedback signals from agent task outcomes
  The agent host enables the learning loop because agent execution provides cheap feedback ("did this memory help the agent succeed?"); the IDE cannot easily measure this. RL/reward machinery becomes applicable when the agent provides the signal.

**Why:** This architecture reframes the kit from passive storage (IDE-only) to active learner (when hosted in an agent). The "missing feedback signal" problem has a natural solution in agent contexts, not in IDE contexts — which justifies two variants instead of retrofitting one.

**How to apply:** When evaluating learning mechanisms or RL machinery, distinguish between IDE feasibility (hard signal) vs agent feasibility (cheap signal). Treat agent-hosted and IDE-hosted as two modes of one kit, not separate products. Future architecture decisions should hinge on "which host supplies the signal?"
