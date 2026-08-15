---
id: P-DRaNKRTM
type: project
title: Three-Tier Memory Architecture
created_at: 2026-06-16T09:16:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 06be02fbd571576f9d4ba2bd675505a6c388209f3d47438a4e64ab9326862a23
related: [research-notes-indexed-via-research-index-not-documentation, always-check-every-memory-file-in-all-tiers-at-cut-gate, cut-gate11-memory-system-three-tier-architecture]
---

- Global tier: `~/.claude-memory-kit` — USER, HABITS, LESSONS, fragments/INDEX
- Project tier: `cut-gate14/context` — MEMORY, SOUL, memory/INDEX, settings.json, logs
- Local tier: `cut-gate14/context.local` — machine-paths, overrides (not committed)

Each tier has a specific role: global user/habit knowledge, project state, machine-local config.

**Why:** Understanding the tier structure is essential for correct memory placement and avoiding committed-tier leaks.

**How to apply:** When auditing or working with memory files, verify across all three tiers. When adding facts, choose the correct tier based on scope (user, project, or machine-local).
