---
id: P-9BPX64ZQ
type: project
title: 13 Stuck Tasks — Categorization and Supersession Map
created_at: 2026-06-28T20:04:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bca0626e87a1d82dee25168ac69f2237e44c3e516d21f638e716bfadaf61604c
related: [release-laning-and-task-dependencies-v0-4-4-v0-5]
---

**Group A — Keep (real gaps, never re-laned):**
- 74: Re-inject memory after compaction (observed bug 2026-06-01)
- 71: Refuse hand-edits to memory (safety)
- 70: Injection-defense (security)
- 97: Dynamic trust (user-requested)
- 66: Temporal validity (bi-temporal model)

**Group B — Keep but merge (overlaps with newer work):**
- 148, 150: AI-judged automation cluster (with 151)
- 95: Dream-style re-curation (overlaps 151 + 66)

**Group C — Questionable (validate before re-laning):**
- 57/58/59: Phase 3 decision-consistency → *potentially superseded by DECISIONS.md journal (Tasks 147/156/159, v0.3.3)*
- 68: Weekly semantic pruning → *marked "validate necessity before building"*
- 146: Kit × Claude Code swarm (niche, low-priority)
- 96: Memory versioning + redact (heavy, "may slip"; pairs with 130)

**Why:** Risk of re-laning work that is already dead (superseded) or not actually needed. Group C requires investigation before committing; Groups A/B can move forward in parallel.

**How to apply:** Investigate 57/58/59-vs-DECISIONS.md overlap; assess 68 necessity; re-lane A/B with honest status labels; document Cursor/Codex/agent-tail entries even if dropped/backlog.
