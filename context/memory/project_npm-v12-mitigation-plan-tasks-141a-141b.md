---
id: P-9NHZ2SV2
type: project
title: npm v12 Mitigation Plan (Tasks 141a–141b)
created_at: 2026-06-12T15:53:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b28748bc2be87263d02fd08de71b6eb0e4cf6162
related: [npm-v12-breaking-change-and-better-sqlite3-migration-plan, npm-12-the-141a-141b-migration-strategy, install-time-consent-for-better-sqlite3-binding-replaces-err]
---

**Problem:** npm v12 (~July 2026) turns install scripts off by default. Our two native deps will silently fail to build:
- better-sqlite3 (core, search index)
- onnxruntime-node (optional --with-semantic)

**Phased solution:**
- Task 141a (mitigation, now): doctor health check + exact remediation command for global npm approve-scripts config + README note
- Task 141b (structural fix, later): migrate to node:sqlite (built-in Node 22.5+), eliminating all native deps

**Install workflows:**
- npm ≤ 11: unchanged
- npm 12 + 141a: install succeeds but scripts blocked → doctor detects & prints approve command → user runs it → retry
- After 141b: just works (zero native deps, zero install scripts)

**Bonus:** Fixes Windows locked-DLL EPERM issue on better-sqlite3 reinstalls; enables future Node version upgrades (engine-floor already unblocked).

**Why:** npm v12 lands July 2026. npm 11.16+ already emits warnings and breaks on our binding. Users will hit silent failures (install succeeds, tool crashes on first use) without mitigation.

**How to apply:** 141a gives users clear guidance (doctor output + README) to survive July; 141b then eliminates the whole fragility class. Coordinate with npm v12 release; test on npm 11.16+.
