---
id: P-64ZT2ZJP
type: project
shape: State
title: Cut-gate split into deterministic (CLI/install) and live (IDE) phases
created_at: 2026-07-15T06:59:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2b45067fe6cbd602e8d45b8c7959b1ebe09c2c463071093390788590c8308971
related: [claude-memory-kit-v0-4-3-release-workflow, release-workflow-cold-open-testing-discipline, multi-gate-release-verification]
---

- **Deterministic (§0–§1)**: tarball build, install+doctor, package-rename path, privacy leak screen, config-dir resolution, CLI verb wiring, guard-memory bin — all runnable in isolation / CI
- **Live (§2–§9)**: real Claude Code session, Stop hook capture/auto-extract, fresh session recall, cold-open habits — requires IDE integration
- For rename-only cuts, deterministic gates + real daily use suffice (live gates re-test unchanged features)

**Why:** Distinguish which gates can run in automation vs which need real IDE session; guides scope for release types

**How to apply:** Before cutting, run §0–§1 gates; for feature-heavy cuts also drive §2–§9; for rename-only, deterministic pass + real usage is sufficient to proceed
