---
id: P-9FHXT5aC
aliases: [P-9FHXT5aC]
type: project
shape: Relationship
title: 'RepoWise: Direct Competitor Architecture & Efficacy Loop'
created_at: 2026-08-15T08:27:36Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d3bd5e73f8b6cd1425414fe509451a8b2e2e60bdbf4d51ef9f0c132cc09776ba
---

RepoWise is the most serious direct competitor identified in landscape scan (1,202 commits in 5 months, ~10 contributors, 58 releases, 11,170 test functions, published benchmarks, PyPI, PR bot, open-core business).

Architecture parallels CMK closely:
- Reads `.claude/projects/*.jsonl` transcripts with byte-offset cursors (Task-148 watermark pattern, independently discovered)
- Mines signals (pushback phrases, decision verbs, repeated failures) via deterministic gates → one batched LLM call where extracted fields must quote transcript verbatim or are dropped
- Observation-counted promotion: 2 sessions or 1 direct correction to promote a decision
- Hard 400-token cap on injected decisions at session start
- **Efficacy loop** (key differentiator): recorded decision injection id; next update replays transcript, classifies whether agent acted on or contradicted guidance—measures whether memory actually works

Structural weakness: `.repowise/` is gitignored local SQLite; teammate clone starts from zero; decisions live per-machine only; no cross-project tier; all decisions are post-hoc mined proposals without trust, screening, or audit trail.

CMK's committed memory system is the structural moat.

**Why:** RepoWise demonstrates a complete, production-grade answer to the same problem CMK solves. Efficacy loop is marked as honest-blank in CMK's SYSTEM-MAP §6. Learning their design and identifying where CMK differs is critical for product differentiation and roadmap prioritization.

**How to apply:** Priority: implement efficacy loop measurement (whether injected guidance is actually acted on vs contradicted). Secondary: adopt MCP staleness tracking, verbatim-quote grounding for auto-extract, deterministic staleness metric (linked-file churn fraction). Emphasize that local-only SQLite is our structural advantage for team/shared scenarios.
