---
id: P-K4X4VRPH
type: project
title: Perf Gate Principle — Search Speed Non-Negotiable
created_at: 2026-06-13T12:59:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 646730663ab003cecf71084634a395cb2e8d37df
related: [task-141b-node-sqlite-migration-rejected-on-perf, node-sqlite-adoption-perf-gate-d-147-execution-plan, v0-3-2-release-scope-expanded]
---

The kit's search latency cannot be traded for install-time UX improvements. User's decision framework:
- Acceptable: one-time friction during setup (npm install, binding prompts)
- Not acceptable: permanent per-query overhead (any runtime regression on hot paths)
- Operational gate: node:sqlite p95 ≤ better-sqlite3 p95 × 1.03 per gated read path (3% is harness noise floor, not a perf budget)

**Why:** User stated search is foundational to the kit's purpose; any permanent slowdown defeats the kit's value. This discipline parallels prior bake-offs (D-109 embedder choice).

**How to apply:** When evaluating storage/dependency trade-offs, always bench hot paths (FTS5 query, vec cosine, per-read reindex) end-to-end. If regression on p95 > 0%, the choice fails — no budget.
