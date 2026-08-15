---
id: P-6X7CCNCW
type: project
title: Release-Cut Workflow for claude-memory-kit
created_at: 2026-06-21T14:40:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 10ed0008c21c0c3ad9105c0de98ac29913e3474a944f7b80ea79ccad165b47cd
related: [release-workflow-full-sequence-for-v0-4-3-and-future-cuts, release-workflow-multi-gate-process-0a-0c, release-git-choreography-memory-release-tag-in-order]
---

The release process is gated in three phases:

**§0a: Prepare & Verify**
- `git checkout main; git pull`
- `npm run release -- minor` (bumps version, updates CHANGELOG.md, resets [Unreleased])
- `git diff` to verify changes
- Stage ONLY `CHANGELOG.md` and `packages/cli/package.json` — exclude context files (they are dogfooding artifacts from the kit capturing its own development facts)

**§0b: Test Artifact**
- `npm pack` to verify the artifact builds
- Install and test the real package (not the source)

**§0c: Backup Dirs**
- Back up any real directories before installing over them

**Staging rule:** Never stage context/ changes in release commits. The kit automatically captures facts about releases (backup-convention discovery, gate structure, etc.) into context/MEMORY.md and context/memory/INDEX.md. These are dogfooding artifacts and do not belong in the release commit. Stage only CHANGELOG.md + packages/cli/package.json.

**Version strategy:** Use `npm run release -- minor` for features. Minor bumps for new capabilities; patch for bug fixes.

**Post-release:** After every ★ in the gate passes, run: `git tag v<version> && git push origin HEAD --tags` to trigger publish.yml (npm + GitHub Release).

**Why:** This workflow is repeatable and ensures releases are clean (only version and changelog land), verified before committing, and properly tagged for automation.

**How to apply:** Before each release, follow the gate document (§0a → §0b → §0c). Stage only the two intended files. The context files will always drift due to dogfooding; use `git status` to confirm before each `git add` command.
