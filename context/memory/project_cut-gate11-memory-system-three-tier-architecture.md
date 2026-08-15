---
id: P-XQRM9UFY
type: project
title: cut-gate11 Memory System Three-Tier Architecture
created_at: 2026-06-14T11:14:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bd5e119a366df2a3fe606b36cde786468b5c4cc1f95158559962ecae5ee07645
related: [three-tier-memory-architecture, sensitive-content-policy-for-memory-capture-system, public-repo-memory-policy]
---

- **Committed tier:** MEMORY.md, SOUL.md, INDEX.md in `context/` — travels with `git clone`
- **Local tier (excluded from git):** `context.local/`, `context/.index/`, `context/.locks/`, transcript temp buffer
- **Temporary tier (excluded):** Raw logs (*.extract.log), machine-specific state
- **Design principle:** H1/T2 portability tenet — only committed tier is shared; local and temp never travel with code

**Why:** Enables safe sharing of scaffold and memory across machines without leaking per-machine artifacts or raw logs

**How to apply:** Apply this structure to similar projects; configure .gitignore to exclude local and temp tiers
