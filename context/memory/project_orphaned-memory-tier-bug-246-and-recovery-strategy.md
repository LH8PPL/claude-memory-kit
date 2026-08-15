---
id: P-7TEaNKZY
type: project
shape: State
title: Orphaned Memory Tier Bug (246) and Recovery Strategy
created_at: 2026-07-22T10:51:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ef8ada85cf27cfc61b5462e621969468de78b4eedd75a4e5ed3780047fbcd55f
related: [capture-hook-bins-create-orphaned-memory-tiers-due-to-missin, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre, orphaned-memory-tier-at-packages-cli-context-2026-06-18-thro]
---

**Definition**: A "pre-existing orphaned tier" is a stray `context/` folder created by the old, buggy version (v0.6.1 and earlier) when the agent ran from a subfolder (monorepo package, build directory). It contains real captured facts that nothing reads (disconnected from the root tier).

**Root cause (Bug 246)**: Capture firing from a subfolder creates `context/` at that unexpected level. The folder persists on disk even after upgrade.

**v0.6.2 fix**: 246 stops *new* orphaned tiers from being created, but does NOT clean up existing ones already on disk.

**Task 248** (proposed): `cmk doctor` enhancement to detect pre-existing orphaned tiers and guide users through recovery. Nice-to-have for upgrade experience; deferred to v0.6.3, not blocking.

**This repo**: `packages/cli/context/` (accumulated since 2026-06-18, 6 facts recovered) and `packages/cli/src/context/` (appeared during Task 241). Both manually found and cleaned up.

**Release decision**: v0.6.2 with 246 is safe to cut immediately; defer 248 to v0.6.3.

**Why:** Real users running <v0.6.2 will have stray folders on disk after upgrade. Understanding the bug chain and recovery path is essential for release notes and post-upgrade support.

**How to apply:** When users report stray `context/` folders at unexpected depths or ask about missing facts after upgrade, reference this. Multiple `context/` folders at different nesting levels often indicate pre-existing orphaned tiers from an old version.
