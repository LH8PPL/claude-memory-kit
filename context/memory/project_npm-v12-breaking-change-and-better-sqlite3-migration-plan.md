---
id: P-CW99QNUX
type: project
title: npm v12 Breaking Change and better-sqlite3 Migration Plan
created_at: 2026-06-11T21:49:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a7b1a799612499ec6b348a29fb9644c0382257fe
related: [npm-v12-mitigation-plan-tasks-141a-141b, npm-12-the-141a-141b-migration-strategy]
---

**Problem (npm v12, July 2026)**: npm disables install scripts by default → better-sqlite3 native binding build skips → fresh installs hit crashed search (requires `npm approve-scripts` to fix).

**Assistant-proposed two-phase fix**:
- **Immediate (v0.3.x)**: `cmk doctor` check + README install note
- **Structural (v0.4)**: Replace better-sqlite3 with `node:sqlite` (Node 22.5+/24, zero scripts, supports loadExtension for sqlite-vec)

**Bonus**: Fixes existing Windows DLL locking (EPERM on reinstall) from better-sqlite3.

Precedent: sqlite-vec already uses binary-in-tarball pattern (no scripts) — ecosystem convergence.

**Why:** npm 12 ships next month, breaking all new users. Structural fix also eliminates known Windows pain. Time-sensitive.

**How to apply:** If accepted, implement immediate phase for v0.3.x. Spike node:sqlite compatibility for v0.4 (mainly Node version floor).
